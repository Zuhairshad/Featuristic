# Next + Supabase reference host

A Next.js App Router host fixture that now carries the **local-only reference implementation of the Data
Import Center** (see [ADR 0002](../../docs/adr/0002-import-center-reference-host.md) and
[the task](../../docs/tasks/import-center.md)). It is an executable reference, not installer output. It talks
only to a Supabase stack started on this machine with the Supabase CLI and a Docker-compatible runtime. No
hosted project, production credential, or outbound delivery is involved.

`src/lib/supabase.ts` still holds the type-only Supabase reference that the read-only inspector reads as
evidence; it is not the runtime client.

## What it does

CSV upload (private bucket) -> column mapping and key selection -> validation preview (nothing written) ->
durable background import (`pgmq`, bounded batches) -> persisted progress -> downloadable row-error CSV ->
replay of failed imports from the last committed row. Imports go into the fixture-owned `import_records`
table (`tenant_id`, `dedupe_key`, JSON `payload`); it is not a generic host-table importer.

### Policies (v1)

| Topic | Rule |
| --- | --- |
| Who | Supabase Auth user who is an `admin` in `tenant_members`. Members and other tenants get nothing. Authority always comes from `auth.uid()` and membership, never from a client-supplied tenant or role. |
| Limits | CSV only, 5 MB, 10,000 data rows, 100 columns, 10,000 characters per cell, batches of 100 rows. |
| Row numbers | 1-based among data rows; the header is not counted. |
| Duplicate key | The admin picks one or more mapped key columns. Each value is NFKC-normalized, trimmed, whitespace-collapsed and lowercased; the key is the JSON array of those values, unique per tenant. |
| Duplicate rows | The first row with a key wins. A later row with the same key, in the same file (`duplicate_in_file`) or already stored by any earlier import (`duplicate_existing`), is **skipped**, persisted as a row error, and never overwrites stored data. |
| Invalid rows | Wrong column count, empty key, or over-long cell: skipped and persisted as row errors. The import still completes. |
| Retries | A failed batch becomes visible again after the queue visibility timeout (30 s). After 3 failed deliveries the message is archived and the import is marked `failed`. Only a fixed, sanitized summary is stored; raw errors and row data are never put in `error_summary`. |
| Redelivery | Each message carries `run_id` and `cursor`. The commit applies only when both still match, so duplicate or superseded messages are acknowledged without effect. |
| Replay | Admin-only. A `failed` import (or a queued/running one with no heartbeat for 5 minutes) gets a new `run_id` and a fresh message at its persisted cursor. Committed rows are not re-imported. Completed imports are never replayed. |

## Run it locally

Prerequisites: Node `>=22.12.0`, pnpm `10.28.1`, and a running Docker-compatible daemon.

```sh
pnpm install --frozen-lockfile
cd fixtures/next-supabase
pnpm supabase:start                  # first run pulls images
pnpm exec supabase status -o env     # copy local values into .env.local (see .env.example)
pnpm supabase:reset                  # recreate schema + seed from scratch (local only)
pnpm dev
```

Seed accounts (local only, password `local-dev-password`): `admin-a@example.test` (admin of tenant A),
`member-a@example.test` (non-admin member of A), `admin-b@example.test` (admin of tenant B).

Nothing runs the worker automatically. An operator calls the internally authenticated endpoint, which
processes a bounded number of messages from the global queue with a service-role client. There is deliberately
no worker control in the tenant UI: a user session must never be able to trigger privileged, cross-tenant work.

```sh
curl -X POST -H "Authorization: Bearer $IMPORT_WORKER_SECRET" "http://localhost:3000/api/internal/import-worker?max=5"
```

## Verification commands

```sh
pnpm test                    # unit tests (no Docker)
pnpm supabase:test:db        # pgTAP: RLS, roles, storage policies, batch commit (needs local stack)
pnpm test:integration        # Storage + Postgres + pgmq + Auth integration (needs local stack)
pnpm typecheck && pnpm build
```

`pnpm test:integration` refuses to run unless the Supabase API and database URLs are loopback addresses.
