# Import Center reference host

- Status: Approved for implementation
- Branch: `feature/import-center`
- Base commit: `f697f31f8121f63c93552f5292667a07d96e7a54`
- Owner: Feature author

## Objective

Build a local-only, executable reference implementation of the Data Import Center in
`fixtures/next-supabase`. The flow is CSV upload, header mapping, validation preview, durable background
import, progress, and downloadable row errors. It is a fixture feature, not FeatureKit installation logic.

## Authorized paths and operations

| Path or operation | Authorization |
| --- | --- |
| `fixtures/next-supabase/app/**`, `src/**` | UI, routes, server modules, and tests for the reference flow. |
| `fixtures/next-supabase/supabase/**` | Local `config.toml`, timestamped migrations, SQL tests, and non-sensitive seed data. |
| `fixtures/next-supabase/package.json`, root lockfile | Exact-pinned, fixture-scoped CSV, Supabase SSR, and local Supabase CLI dependencies only when implementation uses them. |
| `features/import-center/feature.json` | Keep declarative; change only if its existing capabilities become factually wrong. |
| `docs/handoffs/import-center.md` | Record versions, checks, Git state, and deferred production work. |

Use only the local Supabase stack. Do not link, push, or otherwise target a remote database. Do not use
production credentials. Do not implement installer templates, arbitrary-host table writes, webhooks, or
outbound network delivery.

## Required behavior

1. A local Supabase Auth user who is an admin of tenant A can upload a CSV to a private bucket, map headers,
   preview validation failures, start an import, observe durable progress, download its row errors, and replay
   a failed or interrupted import.
2. Authorization comes from `auth.uid()` and `tenant_members`; every tenant-owned row has a `tenant_id` and
   RLS. Tenant B, a non-admin member, and an unauthenticated caller cannot read or change tenant A data.
3. The import target is fixture-owned `import_records` with a JSON payload. It is not a generic host-table
   importer. An admin selects one or more mapped key columns before starting. A normalized, tenant-scoped
   duplicate key skips duplicates from the current or a completed prior import and records a downloadable row
   error without overwriting stored data.
4. Work is enqueued in `pgmq` and processed in bounded batches by a worker module. Persist the cursor,
   status, counts, and row errors transactionally. Failures are retryable; replay enqueues new work for the
   immutable persisted import record. Do not leave a request handler running an unbounded import.
5. The UI labels local services and development-only controls accurately. It must never display
   database URLs, API keys, service credentials, or uploaded raw data from another tenant.

## Verification plan

Run each command against a fresh local stack, using explicit local flags where the CLI supports them:

1. Start local Supabase, apply migrations from scratch, and run database tests. The database tests must prove
   positive admin access and negative tenant-B, non-admin, and unauthenticated access for every tenant-owned
   table and the private upload path.
2. Run focused unit tests for CSV parsing, mapping, validation, normalized duplicate keys, and error-CSV
   generation. Include malformed rows and duplicate rows.
3. Run an integration test against local Supabase Storage, Postgres, and `pgmq`. It must upload a fixture CSV,
   process at least two batches, assert progress and imported records, force interruption between batches, and
   assert retry/replay completes without duplicate records.
4. Run the fixture's TypeScript check and production build, followed by the workspace `pnpm test`,
   `pnpm typecheck`, `pnpm lint`, and `pnpm build` checks. Review the full diff before a commit.

No test may make real outbound network calls. Inject the worker clock and failure seam; use the local
Supabase stack and fixture data instead of a hosted project. If Docker or the local Supabase CLI is unavailable,
record the exact blocked command and do not claim RLS or queue behavior is verified.

## Deferred work

Automated production scheduling, remote Supabase setup, installer templates, target-domain mapping, and
webhook delivery require a separate approved task and ADR.
