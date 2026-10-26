# ADR 0002: Build the Import Center in the local reference host

- Status: Accepted
- Date: 2026-10-27

## Context

The bootstrap deliberately created only a declarative Import Center manifest and an unconfigured Next.js /
Supabase fixture. The first implementation needs a tenant boundary, database schema, durable processing, and
verification without implying that FeatureKit can install those resources into a customer host yet.

## Decision

The canonical implementation branch is `feature/import-center`, created from `f697f31`. A personal agent
branch is not an integration target. `feature/webhook-portal` and all webhook delivery work are outside this
task.

The implementation lives in `fixtures/next-supabase` as a reference host. Its `app/` and `src/` directories
hold the Next.js UI, routes, and server code; `fixtures/next-supabase/supabase/` holds local configuration,
migrations, database tests, and optional seed data. `features/import-center/feature.json` remains a
declarative manifest. No installer template, host mutation, or feature-package source is created until a
separate installer design is accepted. The existing manifest already describes the required capabilities, so
this task does not change `packages/contracts`.

Use local Supabase Auth as the identity source. A migration defines `tenants` and `tenant_members`, with
`admin` and `member` roles. Every tenant-owned Import Center row includes `tenant_id`, and each table has RLS
enabled. Policies must derive the caller from `auth.uid()` and the membership table; a client-provided tenant
identifier or UI-only role check is never authorization. Only an authenticated tenant admin may create,
start, replay, or download an import. The browser never receives a bypass-RLS credential.

The reference Import Center imports into a fixture-owned `import_records` table with a JSON payload. It does
not write to arbitrary application tables. Mapping maps CSV headers to payload keys. Before starting, an
admin selects one or more mapped key columns. The normalized selected values form a tenant-scoped duplicate
key. A duplicate in the same or an earlier completed import is skipped and persisted as a row error; it never
overwrites an existing record. This is the v1 duplicate policy.

Use private Supabase Storage for uploaded CSV files and persist import metadata, row errors, and progress in
Postgres. Use Supabase Queues (`pgmq`) for durable work. A bounded worker claims one message, processes a
bounded row batch, commits its cursor and outcome, and then acknowledges the message. A failed batch remains
retryable through the queue visibility timeout; exhausted work is archived. Replay creates a fresh queue
message from the persisted import record, never mutates a completed import in place. The local worker is a
deliberate command or internally authenticated endpoint backed by the same worker module. Scheduling and
production deployment are deferred; the task must not claim autonomous production execution.

The task authorizes only local Supabase provisioning through the CLI and Docker-compatible runtime. Commit
`config.toml`, migrations, SQL tests, and non-sensitive seed data. Do not run `supabase link`, `supabase db
push`, or any command targeting a remote project. Add exact-pinned, fixture-scoped dependencies only when
used: a CSV parser, `@supabase/ssr` if session-aware server clients are needed, and the Supabase CLI as a
development dependency. Record their selected versions and current official-documentation rationale in the
implementation handoff.

## Consequences

- The fixture becomes an executable security and lifecycle reference, not an installer output.
- A local Docker-compatible runtime is required for migration, RLS, storage, and queue integration tests.
- The next installer task must extract validated templates from this reference host and extend contracts only
  after review.

## Evidence

Supabase documents versioned local migrations, committed local configuration, and `db reset` for recreating
a local schema. Its RLS guidance uses `auth.uid()` as the authenticated caller and requires policies per
operation. Supabase Queues documents `pgmq` as a Postgres-native durable queue with visibility timeouts and
archival. [Database migrations](https://supabase.com/docs/guides/local-development/database-migrations),
[local workflow](https://supabase.com/docs/guides/local-development/cli-workflows),
[RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), and
[Queues](https://supabase.com/docs/guides/queues).
