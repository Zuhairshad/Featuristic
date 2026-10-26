-- pgTAP tests for tenant isolation, role checks, upload path policy, and batch-commit semantics.
-- Run with: pnpm --filter @featurekit/fixture-next-supabase supabase:test:db
-- Depends on supabase/seed.sql users and tenants. Everything runs in a rolled-back transaction.

begin;
create extension if not exists pgtap with schema extensions;
select plan(73);

-- Fixed identities from seed.sql
--   admin A  11111111-0000-4000-8000-00000000000a  (tenant A admin)
--   member A 11111111-0000-4000-8000-00000000000b  (tenant A member, non-admin)
--   admin B  11111111-0000-4000-8000-00000000000c  (tenant B admin)

create function pg_temp.as_user(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', p_uid::text, true);
  perform set_config('role', 'authenticated', true);
end $$;

-- Invoker-rights helper: runs a statement as the current role and reports how many rows it touched.
create function public.pgtap_rows_affected(p_sql text) returns integer language plpgsql as $$
declare n integer;
begin
  execute p_sql;
  get diagnostics n = row_count;
  return n;
end $$;

-- ----- fixtures (inserted as the migration owner) -----
insert into storage.objects (bucket_id, name) values
  ('import-uploads', 'aaaaaaaa-0000-4000-8000-000000000001/seed-a.csv'),
  ('import-uploads', 'aaaaaaaa-0000-4000-8000-000000000001/seed-a-start.csv'),
  ('import-uploads', 'bbbbbbbb-0000-4000-8000-000000000002/seed-b.csv');

insert into public.imports (id, tenant_id, created_by, file_name, storage_path, file_sha256, header, mapping,
                            key_columns, batch_size, total_rows, status)
values
  ('a0000000-0000-4000-8000-000000000001', 'aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-00000000000a',
   'a.csv', 'aaaaaaaa-0000-4000-8000-000000000001/seed-a.csv', repeat('a', 64),
   '["email","name"]', '{"email":"email","name":"name"}', '{email}', 100, 4, 'failed'),
  ('a0000000-0000-4000-8000-000000000002', 'aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-00000000000a',
   'a2.csv', 'aaaaaaaa-0000-4000-8000-000000000001/done.csv', repeat('b', 64),
   '["email"]', '{"email":"email"}', '{email}', 100, 1, 'completed'),
  ('b0000000-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000002', '11111111-0000-4000-8000-00000000000c',
   'b.csv', 'bbbbbbbb-0000-4000-8000-000000000002/seed-b.csv', repeat('c', 64),
   '["email"]', '{"email":"email"}', '{email}', 100, 4, 'queued');

insert into public.import_row_errors (tenant_id, import_id, row_number, code, message, row_values) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 1, 'missing_key', 'x', '{}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 1, 'missing_key', 'x', '{}');

insert into public.import_records (tenant_id, import_id, row_number, dedupe_key, payload) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 1, '["a-existing"]', '{"email":"a-existing"}'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 1, '["b-existing"]', '{"email":"b-existing"}');

-- ----- structure: RLS is enabled on every tenant-owned table -----
select is(
  (select count(*)::int from pg_class c join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public' and c.relname in ('tenants','tenant_members','imports','import_row_errors','import_records')
     and c.relrowsecurity),
  5, 'RLS is enabled on all five tenant-owned tables');

select is((select public from storage.buckets where id = 'import-uploads'), false, 'upload bucket is private');

-- ----- tenant A admin: positive access -----
reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000a');
select is((select count(*)::int from public.imports), 2, 'admin A sees tenant A imports');
select is((select count(*)::int from public.imports where tenant_id = 'bbbbbbbb-0000-4000-8000-000000000002'), 0, 'admin A sees no tenant B imports');
select is((select count(*)::int from public.import_row_errors), 1, 'admin A sees only tenant A row errors');
select is((select count(*)::int from public.import_records), 1, 'admin A sees only tenant A records');
select is((select count(*)::int from public.tenants), 1, 'admin A sees only tenant A');
select is((select count(*)::int from public.tenant_members), 2, 'admin A sees tenant A members');
select is((select count(*)::int from storage.objects where bucket_id = 'import-uploads'), 2, 'admin A sees only tenant A uploads');

-- ----- tenant A non-admin member: no import data -----
reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000b');
select is((select count(*)::int from public.imports), 0, 'member sees no imports');
select is((select count(*)::int from public.import_row_errors), 0, 'member sees no row errors');
select is((select count(*)::int from public.import_records), 0, 'member sees no records');
select is((select count(*)::int from public.tenant_members), 1, 'member sees only their own membership row');
select is((select count(*)::int from storage.objects where bucket_id = 'import-uploads'), 0, 'member sees no uploads');

-- ----- tenant B admin: isolated -----
reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000c');
select is((select count(*)::int from public.imports), 1, 'admin B sees exactly one import');
select is((select id from public.imports), 'b0000000-0000-4000-8000-000000000001'::uuid, 'admin B sees only its own import');
select is((select count(*)::int from public.import_row_errors where tenant_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'admin B sees no tenant A row errors');
select is((select count(*)::int from public.import_records where tenant_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'admin B sees no tenant A records');
select is((select count(*)::int from public.tenant_members where tenant_id = 'aaaaaaaa-0000-4000-8000-000000000001'), 0, 'admin B sees no tenant A members');
select is((select count(*)::int from storage.objects where name like 'aaaaaaaa-%'), 0, 'admin B sees no tenant A uploads');

-- ----- unauthenticated: denied outright -----
reset role; set local role anon; select set_config('request.jwt.claims', '', true);
select throws_ok('select * from public.tenants', '42501', null, 'anon cannot read tenants');
select throws_ok('select * from public.tenant_members', '42501', null, 'anon cannot read tenant_members');
select throws_ok('select * from public.imports', '42501', null, 'anon cannot read imports');
select throws_ok('select * from public.import_row_errors', '42501', null, 'anon cannot read row errors');
select throws_ok('select * from public.import_records', '42501', null, 'anon cannot read records');
select throws_ok($$select public.replay_import('a0000000-0000-4000-8000-000000000001')$$, '42501', null, 'anon cannot replay');
select is((select count(*)::int from storage.objects where bucket_id = 'import-uploads'), 0, 'anon sees no uploads');

-- ----- direct writes are impossible for client roles (privilege escalation / tampering) -----
reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000b');
select throws_ok(
  $$insert into public.tenant_members (tenant_id, user_id, role) values ('aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-00000000000b','admin')$$,
  '42501', null, 'member cannot grant themselves admin');
select throws_ok(
  $$update public.tenant_members set role = 'admin' where user_id = '11111111-0000-4000-8000-00000000000b'$$,
  '42501', null, 'member cannot update roles');

reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000a');
select throws_ok($$update public.imports set status = 'completed'$$, '42501', null, 'admin cannot update imports directly');
select throws_ok($$delete from public.imports$$, '42501', null, 'admin cannot delete imports directly');
select throws_ok($$delete from public.import_row_errors$$, '42501', null, 'admin cannot delete row errors directly');
select throws_ok($$insert into public.import_records (tenant_id, import_id, row_number, dedupe_key, payload) values ('aaaaaaaa-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000001',9,'["x"]','{}')$$,
  '42501', null, 'admin cannot insert records directly');

-- ----- start_import authorization -----
reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000b');
select throws_ok(
  $$select public.start_import('aaaaaaaa-0000-4000-8000-000000000001','m.csv','aaaaaaaa-0000-4000-8000-000000000001/seed-a-start.csv',repeat('d',64),'["email"]','{"email":"email"}','{email}',2)$$,
  '42501', 'not_authorized', 'non-admin member cannot start an import');

reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000c');
select throws_ok(
  $$select public.start_import('aaaaaaaa-0000-4000-8000-000000000001','x.csv','aaaaaaaa-0000-4000-8000-000000000001/seed-a-start.csv',repeat('d',64),'["email"]','{"email":"email"}','{email}',2)$$,
  '42501', 'not_authorized', 'tenant B admin cannot start an import in tenant A');

reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000a');
select throws_ok(
  $$select public.start_import('aaaaaaaa-0000-4000-8000-000000000001','x.csv','bbbbbbbb-0000-4000-8000-000000000002/seed-b.csv',repeat('d',64),'["email"]','{"email":"email"}','{email}',2)$$,
  '22023', 'invalid_storage_path', 'admin A cannot point an import at tenant B upload path');
select throws_ok(
  $$select public.start_import('aaaaaaaa-0000-4000-8000-000000000001','x.csv','aaaaaaaa-0000-4000-8000-000000000001/missing.csv',repeat('d',64),'["email"]','{"email":"email"}','{email}',2)$$,
  '22023', 'upload_not_found', 'start_import requires an existing upload');
select throws_ok(
  $$select public.start_import('aaaaaaaa-0000-4000-8000-000000000001','x.csv','aaaaaaaa-0000-4000-8000-000000000001/seed-a-start.csv',repeat('d',64),'["email"]','{"email":"email"}','{unmapped}',2)$$,
  '22023', 'invalid_key_columns', 'key columns must be mapped headers');
select lives_ok(
  $$select public.start_import('aaaaaaaa-0000-4000-8000-000000000001','ok.csv','aaaaaaaa-0000-4000-8000-000000000001/seed-a-start.csv',repeat('d',64),'["email"]','{"email":"email"}','{email}',2)$$,
  'admin A can start an import');
select is((select status from public.imports where storage_path like '%seed-a-start.csv'), 'queued', 'started import is queued');

-- ----- existing_dedupe_keys is RLS-scoped -----
reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000a');
select is((select count(*)::int from public.existing_dedupe_keys('aaaaaaaa-0000-4000-8000-000000000001', array['["a-existing"]','["nope"]'])), 1,
  'admin A finds an existing tenant A key');
select is((select count(*)::int from public.existing_dedupe_keys('bbbbbbbb-0000-4000-8000-000000000002', array['["b-existing"]'])), 0,
  'admin A cannot probe tenant B keys');
reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000b');
select is((select count(*)::int from public.existing_dedupe_keys('aaaaaaaa-0000-4000-8000-000000000001', array['["a-existing"]'])), 0,
  'a non-admin member cannot probe tenant A keys');
reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000c');
select is((select count(*)::int from public.existing_dedupe_keys('aaaaaaaa-0000-4000-8000-000000000001', array['["a-existing"]'])), 0,
  'tenant B admin cannot probe tenant A keys');

-- ----- replay_import authorization and state rules -----
reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000c');
select throws_ok($$select public.replay_import('a0000000-0000-4000-8000-000000000001')$$, 'P0002', 'import_not_found',
  'tenant B admin cannot replay a tenant A import');
select throws_ok($$select public.replay_import('00000000-0000-4000-8000-0000000000ff')$$, 'P0002', 'import_not_found',
  'missing import yields the same error as a foreign import');

reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000b');
select throws_ok($$select public.replay_import('a0000000-0000-4000-8000-000000000001')$$, 'P0002', 'import_not_found',
  'non-admin member cannot replay');

reset role; select pg_temp.as_user('11111111-0000-4000-8000-00000000000a');
select throws_ok($$select public.replay_import('a0000000-0000-4000-8000-000000000002')$$, 'P0001', 'import_not_replayable',
  'completed imports are never replayed');
select lives_ok($$select public.replay_import('a0000000-0000-4000-8000-000000000001')$$, 'admin A can replay a failed import');
select is((select run_id from public.imports where id = 'a0000000-0000-4000-8000-000000000001'), 2, 'replay bumps the run id');
select is((select status from public.imports where id = 'a0000000-0000-4000-8000-000000000001'), 'queued', 'replay re-queues the import');
select throws_ok($$select public.replay_import('a0000000-0000-4000-8000-000000000001')$$, 'P0001', 'import_not_replayable',
  'a freshly queued import cannot be replayed again');

-- ----- storage: admins cannot write into another tenant or modify objects -----
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('import-uploads', 'bbbbbbbb-0000-4000-8000-000000000002/evil.csv')$$,
  '42501', null, 'admin A cannot upload into tenant B path');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('import-uploads', 'not-a-tenant/evil.csv')$$,
  '42501', null, 'malformed upload path is rejected');
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('import-uploads', 'aaaaaaaa-0000-4000-8000-000000000001/ok-upload.csv')$$,
  'admin A can upload into the tenant A path');
select is(public.pgtap_rows_affected($$update storage.objects set name = name || 'x' where bucket_id = 'import-uploads'$$),
  0, 'admin A cannot rename uploads');
select throws_ok($$delete from storage.objects where bucket_id = 'import-uploads'$$, '42501',
  'Direct deletion from storage tables is not allowed. Use the Storage API instead.',
  'admin A cannot delete uploads with SQL (Storage trigger); no delete policy exists for the Storage API either');

-- ----- worker functions and the queue are not reachable from a session -----
select throws_ok($$select * from public.import_queue_read(30)$$, '42501', null, 'admin cannot read the queue through worker functions');
select throws_ok(
  $$select public.commit_import_batch('a0000000-0000-4000-8000-000000000001', 2, 0, 1, '[]', '[]', now())$$,
  '42501', null, 'admin cannot call commit_import_batch');
select throws_ok($$select public.fail_import('a0000000-0000-4000-8000-000000000001', 2, 'x', now())$$, '42501', null,
  'admin cannot call fail_import');
select throws_ok($$select * from pgmq.read('import_center_jobs', 30, 1)$$, '42501', null, 'admin cannot call pgmq directly');

-- ----- commit_import_batch semantics (as the owner, standing in for service_role) -----
reset role;
insert into storage.objects (bucket_id, name) values ('import-uploads', 'aaaaaaaa-0000-4000-8000-000000000001/commit.csv');
insert into public.imports (id, tenant_id, created_by, file_name, storage_path, file_sha256, header, mapping,
                            key_columns, batch_size, total_rows, status)
values ('a0000000-0000-4000-8000-0000000000c1', 'aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-00000000000a',
        'commit.csv', 'aaaaaaaa-0000-4000-8000-000000000001/commit.csv', repeat('e', 64),
        '["email"]', '{"email":"email"}', '{email}', 3, 4, 'queued');

select is(
  public.commit_import_batch('a0000000-0000-4000-8000-0000000000c1', 1, 0, 3,
    '[{"row_number":1,"dedupe_key":"[\"k1\"]","payload":{"email":"k1"},"values":{"email":"K1"}},
      {"row_number":2,"dedupe_key":"[\"k1\"]","payload":{"email":"k1"},"values":{"email":"k1 "}}]'::jsonb,
    '[{"row_number":3,"code":"missing_key","message":"Key column email is empty.","values":{"email":""}}]'::jsonb,
    now()),
  'committed', 'first batch commits');
select results_eq(
  $$select imported_count, duplicate_count, invalid_count, cursor, status from public.imports where id = 'a0000000-0000-4000-8000-0000000000c1'$$,
  $$values (1, 1, 1, 3, 'running')$$, 'counters, cursor and status reflect the first batch');
select is((select code from public.import_row_errors where import_id = 'a0000000-0000-4000-8000-0000000000c1' and row_number = 2),
  'duplicate_in_file', 'in-file duplicate is persisted as a row error');
select is((select count(*)::int from public.import_records where import_id = 'a0000000-0000-4000-8000-0000000000c1'), 1,
  'only the first of two duplicate rows is stored');
select is((select count(*)::int from pgmq.q_import_center_jobs where (message ->> 'import_id') = 'a0000000-0000-4000-8000-0000000000c1' and (message ->> 'cursor') = '3'),
  1, 'a continuation message is enqueued at the new cursor');

select is(
  public.commit_import_batch('a0000000-0000-4000-8000-0000000000c1', 1, 0, 3, '[]', '[]', now()),
  'stale', 'replaying an already-committed cursor is a no-op');
select is(
  public.commit_import_batch('a0000000-0000-4000-8000-0000000000c1', 99, 3, 4, '[]', '[]', now()),
  'stale', 'a superseded run id is a no-op');

select is(
  public.commit_import_batch('a0000000-0000-4000-8000-0000000000c1', 1, 3, 4,
    '[{"row_number":4,"dedupe_key":"[\"a-existing\"]","payload":{"email":"a-existing"},"values":{"email":"A-Existing"}}]'::jsonb,
    '[]'::jsonb, now()),
  'committed', 'final batch commits');
select is((select code from public.import_row_errors where import_id = 'a0000000-0000-4000-8000-0000000000c1' and row_number = 4),
  'duplicate_existing', 'duplicate of a prior import is a row error and does not overwrite');
select is((select payload ->> 'email' from public.import_records where dedupe_key = '["a-existing"]'), 'a-existing',
  'the stored record from the earlier import is unchanged');
select results_eq(
  $$select imported_count, duplicate_count, invalid_count, cursor, status from public.imports where id = 'a0000000-0000-4000-8000-0000000000c1'$$,
  $$values (1, 2, 1, 4, 'completed')$$, 'import completes with consistent counters');

select is(
  public.commit_import_batch('a0000000-0000-4000-8000-0000000000c1', 1, 4, 5, '[]', '[]', now()),
  'stale', 'commits after completion are no-ops');

select * from finish();
rollback;
