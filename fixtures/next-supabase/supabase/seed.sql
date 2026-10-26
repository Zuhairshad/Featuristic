-- Local development seed. Non-sensitive, fixed identifiers; never run against a hosted project.
-- All three users share the development-only password: local-dev-password

insert into public.tenants (id, name) values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Tenant A (local seed)'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'Tenant B (local seed)');

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  crypt('local-dev-password', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now(),
  '', '', '', ''
from (values
  ('11111111-0000-4000-8000-00000000000a'::uuid, 'admin-a@example.test'),
  ('11111111-0000-4000-8000-00000000000b'::uuid, 'member-a@example.test'),
  ('11111111-0000-4000-8000-00000000000c'::uuid, 'admin-b@example.test')
) as u (id, email);

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.email in ('admin-a@example.test', 'member-a@example.test', 'admin-b@example.test');

insert into public.tenant_members (tenant_id, user_id, role) values
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-00000000000a', 'admin'),
  ('aaaaaaaa-0000-4000-8000-000000000001', '11111111-0000-4000-8000-00000000000b', 'member'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '11111111-0000-4000-8000-00000000000c', 'admin');
