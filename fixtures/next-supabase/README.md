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
| Limits | CSV only, 5 MB, 10,000 data rows, 100 columns, 10,000 characters per cell, batches of 100 rows. Request bodies are capped while they are read (upload 5 MB plus multipart framing, JSON 64 KB), so a missing or forged `Content-Length` cannot make the server buffer more. |
| Row numbers | 1-based among data rows; the header is not counted. |
| Duplicate key | The admin picks one or more mapped key columns. Each value is NFKC-normalized, trimmed, whitespace-collapsed and lowercased; the key is the JSON array of those values, unique per tenant. |
| Duplicate rows | The first writer of a key wins. If the key is already stored by any earlier import, **every** file row with it is `duplicate_existing`. Otherwise the first file row imports and later ones are `duplicate_in_file`. Duplicates are **skipped**, persisted as row errors, and never overwrite stored data. The preview applies the same rule, so its codes and counts match what is persisted. |
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

Nothing runs the worker automatically, and **no signed-in user can start it**. The worker uses a service-role
client over a single global queue, so exposing it to any tenant admin would let one tenant advance another
tenant's import. Only an operator holding `IMPORT_WORKER_SECRET` can start it, through the bounded endpoint:

```sh
curl -X POST -H "Authorization: Bearer $IMPORT_WORKER_SECRET" "http://localhost:3000/api/internal/import-worker?max=5"
```

The endpoint is disabled when `IMPORT_WORKER_SECRET` is unset. An import stays `Queued` until an operator runs it.

## Verification commands

```sh
pnpm test                    # unit tests (no Docker)
pnpm supabase:test:db        # pgTAP: RLS, roles, storage policies, batch commit (needs local stack)
pnpm test:integration        # Storage + Postgres + pgmq + Auth integration (needs local stack)
pnpm typecheck && pnpm build
```

`pnpm test:integration` refuses to run unless the Supabase API and database URLs are loopback addresses.
