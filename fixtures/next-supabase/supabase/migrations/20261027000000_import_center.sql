-- Import Center reference host (local fixture only). See docs/adr/0002-import-center-reference-host.md.
--
-- Authorization model
--   * Identity comes from Supabase Auth (auth.uid()). No client-supplied tenant id or role is trusted.
--   * Tenant roles live in public.tenant_members ('admin' | 'member'). Only admins touch Import Center data.
--   * Browser-facing roles (anon, authenticated) get SELECT only. All writes go through SECURITY DEFINER
--     functions that re-check admin membership, or through service-role-only worker functions.

create extension if not exists pgmq;

-- ---------------------------------------------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------------------------------------------

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  created_at timestamptz not null default now()
);

create table public.tenant_members (
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create index tenant_members_user_id_idx on public.tenant_members (user_id);

-- Caller-derived admin check. SECURITY DEFINER so policies on tenant_members do not recurse.
create function public.is_tenant_admin(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tenant_members m
    where m.tenant_id = p_tenant_id
      and m.user_id = (select auth.uid())
      and m.role = 'admin'
  );
$$;

-- Tenant id encoded in a storage object path "<tenant_id>/<file>"; NULL when the path is malformed.
create function public.storage_path_tenant(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(p_name, '/', 1)::uuid
    else null
  end;
$$;

-- ---------------------------------------------------------------------------------------------
-- Import Center tables
-- ---------------------------------------------------------------------------------------------

create table public.imports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  created_by uuid not null references auth.users (id),
  file_name text not null check (char_length(file_name) between 1 and 255),
  storage_path text not null unique,
  file_sha256 text not null check (file_sha256 ~ '^[0-9a-f]{64}$'),
  header jsonb not null,
  mapping jsonb not null,
  key_columns text[] not null check (cardinality(key_columns) between 1 and 10),
  batch_size integer not null check (batch_size between 1 and 500),
  total_rows integer not null check (total_rows > 0),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  run_id integer not null default 1,
  cursor integer not null default 0 check (cursor >= 0 and cursor <= total_rows),
  imported_count integer not null default 0,
  duplicate_count integer not null default 0,
  invalid_count integer not null default 0,
  attempts integer not null default 0,
  error_summary text,
  created_at timestamptz not null default now(),
  heartbeat_at timestamptz not null default now(),
  completed_at timestamptz,
  check (imported_count + duplicate_count + invalid_count = cursor)
);

create index imports_tenant_created_idx on public.imports (tenant_id, created_at desc);

create table public.import_row_errors (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  import_id uuid not null references public.imports (id) on delete cascade,
  row_number integer not null check (row_number > 0),
  code text not null,
  message text not null,
  row_values jsonb not null,
  created_at timestamptz not null default now(),
  unique (import_id, row_number)
);

create table public.import_records (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants (id) on delete cascade,
  import_id uuid not null references public.imports (id) on delete cascade,
  row_number integer not null,
  dedupe_key text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  -- v1 duplicate policy: one stored record per normalized key per tenant; first writer wins.
  unique (tenant_id, dedupe_key)
);

create index import_records_import_idx on public.import_records (import_id, row_number);

-- ---------------------------------------------------------------------------------------------
-- Table privileges and RLS (defense in depth: grants AND policies)
-- ---------------------------------------------------------------------------------------------

alter table public.tenants enable row level security;
alter table public.tenant_members enable row level security;
alter table public.imports enable row level security;
alter table public.import_row_errors enable row level security;
alter table public.import_records enable row level security;

revoke all on public.tenants, public.tenant_members, public.imports,
  public.import_row_errors, public.import_records from anon, authenticated;
grant select on public.tenants, public.tenant_members, public.imports,
  public.import_row_errors, public.import_records to authenticated;

-- A user sees tenants they belong to (needed to pick a workspace) and their own membership rows.
-- Admins additionally see all members of tenants they administer.
create policy tenants_select_member on public.tenants
  for select to authenticated
  using (
    exists (
      select 1 from public.tenant_members m
      where m.tenant_id = tenants.id and m.user_id = (select auth.uid())
    )
  );

create policy tenant_members_select_self_or_admin on public.tenant_members
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_tenant_admin(tenant_id));

create policy imports_select_admin on public.imports
  for select to authenticated
  using (public.is_tenant_admin(tenant_id));

create policy import_row_errors_select_admin on public.import_row_errors
  for select to authenticated
  using (public.is_tenant_admin(tenant_id));

create policy import_records_select_admin on public.import_records
  for select to authenticated
  using (public.is_tenant_admin(tenant_id));

-- ---------------------------------------------------------------------------------------------
-- Private upload bucket: "<tenant_id>/<upload>.csv", admin-only read and insert, no update/delete.
-- ---------------------------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('import-uploads', 'import-uploads', false, 5242880, array['text/csv'])
on conflict (id) do update
  set public = false, file_size_limit = 5242880, allowed_mime_types = array['text/csv'];

create policy import_uploads_admin_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'import-uploads'
    and public.is_tenant_admin(public.storage_path_tenant(name))
  );

create policy import_uploads_admin_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'import-uploads'
    and public.is_tenant_admin(public.storage_path_tenant(name))
  );

-- ---------------------------------------------------------------------------------------------
-- Durable queue (pgmq). Not exposed to API roles.
-- ---------------------------------------------------------------------------------------------

select pgmq.create('import_center_jobs');

revoke all on schema pgmq from public, anon, authenticated;
revoke all on all tables in schema pgmq from public, anon, authenticated;
revoke all on all functions in schema pgmq from public, anon, authenticated;

-- ---------------------------------------------------------------------------------------------
-- Admin operations (authenticated callers; every function re-checks admin membership)
-- ---------------------------------------------------------------------------------------------

create function public.start_import(
  p_tenant_id uuid,
  p_file_name text,
  p_storage_path text,
  p_file_sha256 text,
  p_header jsonb,
  p_mapping jsonb,
  p_key_columns text[],
  p_total_rows integer,
  p_batch_size integer default 100
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_import_id uuid;
begin
  if (select auth.uid()) is null or not public.is_tenant_admin(p_tenant_id) then
    raise exception 'not_authorized' using errcode = '42501';
  end if;

  if public.storage_path_tenant(p_storage_path) is distinct from p_tenant_id then
    raise exception 'invalid_storage_path' using errcode = '22023';
  end if;

  if not exists (
    select 1 from storage.objects o
    where o.bucket_id = 'import-uploads' and o.name = p_storage_path
  ) then
    raise exception 'upload_not_found' using errcode = '22023';
  end if;

  if jsonb_typeof(p_header) is distinct from 'array' or jsonb_typeof(p_mapping) is distinct from 'object' then
    raise exception 'invalid_mapping' using errcode = '22023';
  end if;

  -- Every key column must be a mapped header.
  if exists (
    select 1 from unnest(p_key_columns) k where not (p_mapping ? k)
  ) then
    raise exception 'invalid_key_columns' using errcode = '22023';
  end if;

  insert into public.imports (
    tenant_id, created_by, file_name, storage_path, file_sha256, header, mapping,
    key_columns, total_rows, batch_size
  )
  values (
    p_tenant_id, (select auth.uid()), p_file_name, p_storage_path, p_file_sha256, p_header,
    p_mapping, p_key_columns, p_total_rows, p_batch_size
  )
  returning id into v_import_id;

  perform pgmq.send(
    'import_center_jobs',
    jsonb_build_object('import_id', v_import_id, 'run_id', 1, 'cursor', 0)
  );

  return v_import_id;
end;
$$;

-- Replay resumes a failed (or stalled) import from its last committed cursor under a new run id.
-- It never touches completed imports and never re-imports committed rows.
create function public.replay_import(p_import_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_import public.imports;
begin
  select * into v_import from public.imports where id = p_import_id for update;

  -- Same error for "missing" and "someone else's" so existence is not disclosed.
  if not found or not public.is_tenant_admin(v_import.tenant_id) then
    raise exception 'import_not_found' using errcode = 'P0002';
  end if;

  if not (
    v_import.status = 'failed'
    or (v_import.status in ('queued', 'running') and v_import.heartbeat_at < now() - interval '5 minutes')
  ) then
    raise exception 'import_not_replayable' using errcode = 'P0001';
  end if;

  update public.imports
  set run_id = run_id + 1,
      status = 'queued',
      attempts = 0,
      error_summary = null,
      heartbeat_at = now()
  where id = p_import_id
  returning * into v_import;

  perform pgmq.send(
    'import_center_jobs',
    jsonb_build_object('import_id', v_import.id, 'run_id', v_import.run_id, 'cursor', v_import.cursor)
  );
end;
$$;

-- Which of these normalized keys already exist for the tenant? SECURITY INVOKER: RLS limits the result
-- to tenants the caller administers, so a member or another tenant's admin always gets an empty set.
create function public.existing_dedupe_keys(p_tenant_id uuid, p_keys text[])
returns setof text
language sql
stable
security invoker
set search_path = ''
as $$
  select r.dedupe_key
  from public.import_records r
  where r.tenant_id = p_tenant_id and r.dedupe_key = any (p_keys);
$$;

revoke all on function public.start_import(uuid, text, text, text, jsonb, jsonb, text[], integer, integer) from public, anon;
revoke all on function public.replay_import(uuid) from public, anon;
grant execute on function public.start_import(uuid, text, text, text, jsonb, jsonb, text[], integer, integer) to authenticated;
grant execute on function public.replay_import(uuid) to authenticated;
revoke all on function public.existing_dedupe_keys(uuid, text[]) from public, anon;
grant execute on function public.existing_dedupe_keys(uuid, text[]) to authenticated;
grant execute on function public.is_tenant_admin(uuid) to authenticated;
grant execute on function public.storage_path_tenant(text) to authenticated;

-- ---------------------------------------------------------------------------------------------
-- Worker operations (service_role only; never callable from a browser session)
-- ---------------------------------------------------------------------------------------------

create function public.import_queue_read(p_visibility_timeout integer)
returns table (msg_id bigint, read_ct integer, message jsonb)
language sql
security definer
set search_path = ''
as $$
  select r.msg_id, r.read_ct, r.message from pgmq.read('import_center_jobs', p_visibility_timeout, 1) r;
$$;

create function public.import_queue_ack(p_msg_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select pgmq.delete('import_center_jobs', p_msg_id);
$$;

create function public.import_queue_archive(p_msg_id bigint)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select pgmq.archive('import_center_jobs', p_msg_id);
$$;

-- Commits one batch atomically: records, row errors, counters, cursor, status and the continuation
-- message. Returns 'stale' (and changes nothing) when the run id, cursor or status no longer match,
-- which makes redelivered or superseded messages harmless.
create function public.commit_import_batch(
  p_import_id uuid,
  p_run_id integer,
  p_cursor integer,
  p_next_cursor integer,
  p_records jsonb,
  p_errors jsonb,
  p_now timestamptz
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_import public.imports;
  v_inserted integer[];
  v_dup integer;
  v_invalid integer;
  v_done boolean;
begin
  select * into v_import from public.imports where id = p_import_id for update;

  if not found
     or v_import.status not in ('queued', 'running')
     or v_import.run_id <> p_run_id
     or v_import.cursor <> p_cursor then
    return 'stale';
  end if;

  if p_next_cursor <= p_cursor or p_next_cursor > v_import.total_rows then
    raise exception 'invalid_cursor';
  end if;

  if jsonb_array_length(p_records) + jsonb_array_length(p_errors) <> p_next_cursor - p_cursor then
    raise exception 'batch_row_count_mismatch';
  end if;

  -- Valid rows: first writer of a normalized key wins; conflicts are skipped, never overwritten.
  with incoming as (
    select (r ->> 'row_number')::integer as rn, r ->> 'dedupe_key' as dk, r -> 'payload' as payload
    from jsonb_array_elements(p_records) r
  ),
  ins as (
    insert into public.import_records (tenant_id, import_id, row_number, dedupe_key, payload)
    select v_import.tenant_id, p_import_id, i.rn, i.dk, i.payload
    from incoming i
    order by i.rn
    on conflict (tenant_id, dedupe_key) do nothing
    returning row_number
  )
  select coalesce(array_agg(ins.row_number), '{}') into v_inserted from ins;

  -- Rows that lost the conflict become persisted duplicate errors.
  insert into public.import_row_errors (tenant_id, import_id, row_number, code, message, row_values)
  select
    v_import.tenant_id,
    p_import_id,
    (r ->> 'row_number')::integer,
    case when existing.import_id = p_import_id then 'duplicate_in_file' else 'duplicate_existing' end,
    case
      when existing.import_id = p_import_id
        then 'Duplicate key: same as row ' || existing.row_number || ' in this file. Row skipped.'
      else 'Duplicate key: a record with this key was already imported. Row skipped.'
    end,
    coalesce(r -> 'values', '{}'::jsonb)
  from jsonb_array_elements(p_records) r
  join public.import_records existing
    on existing.tenant_id = v_import.tenant_id and existing.dedupe_key = r ->> 'dedupe_key'
  where not ((r ->> 'row_number')::integer = any (v_inserted));

  get diagnostics v_dup = row_count;

  -- Rows the worker rejected during validation.
  insert into public.import_row_errors (tenant_id, import_id, row_number, code, message, row_values)
  select v_import.tenant_id, p_import_id, (e ->> 'row_number')::integer, e ->> 'code', e ->> 'message',
         coalesce(e -> 'values', '{}'::jsonb)
  from jsonb_array_elements(p_errors) e;

  get diagnostics v_invalid = row_count;

  v_done := p_next_cursor >= v_import.total_rows;

  update public.imports
  set cursor = p_next_cursor,
      imported_count = imported_count + coalesce(cardinality(v_inserted), 0),
      duplicate_count = duplicate_count + v_dup,
      invalid_count = invalid_count + v_invalid,
      status = case when v_done then 'completed' else 'running' end,
      attempts = 0,
      error_summary = null,
      heartbeat_at = p_now,
      completed_at = case when v_done then p_now else null end
  where id = p_import_id;

  if not v_done then
    perform pgmq.send(
      'import_center_jobs',
      jsonb_build_object('import_id', p_import_id, 'run_id', p_run_id, 'cursor', p_next_cursor)
    );
  end if;

  return 'committed';
end;
$$;

-- Records a retryable batch failure with an already-sanitized summary.
create function public.record_import_attempt_failure(p_import_id uuid, p_run_id integer, p_summary text)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.imports
  set attempts = attempts + 1, error_summary = left(p_summary, 300)
  where id = p_import_id and run_id = p_run_id and status in ('queued', 'running');
$$;

-- Marks an import failed; it stays resumable through replay_import.
create function public.fail_import(p_import_id uuid, p_run_id integer, p_summary text, p_now timestamptz)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.imports
  set status = 'failed', error_summary = left(p_summary, 300), heartbeat_at = p_now
  where id = p_import_id and run_id = p_run_id and status in ('queued', 'running');
$$;

revoke all on function public.import_queue_read(integer) from public, anon, authenticated;
revoke all on function public.import_queue_ack(bigint) from public, anon, authenticated;
revoke all on function public.import_queue_archive(bigint) from public, anon, authenticated;
revoke all on function public.commit_import_batch(uuid, integer, integer, integer, jsonb, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function public.record_import_attempt_failure(uuid, integer, text) from public, anon, authenticated;
revoke all on function public.fail_import(uuid, integer, text, timestamptz) from public, anon, authenticated;

grant execute on function public.import_queue_read(integer) to service_role;
grant execute on function public.import_queue_ack(bigint) to service_role;
grant execute on function public.import_queue_archive(bigint) to service_role;
grant execute on function public.commit_import_batch(uuid, integer, integer, integer, jsonb, jsonb, timestamptz) to service_role;
grant execute on function public.record_import_attempt_failure(uuid, integer, text) to service_role;
grant execute on function public.fail_import(uuid, integer, text, timestamptz) to service_role;
