# Import Center reference host handoff

- Task: [`docs/tasks/import-center.md`](../tasks/import-center.md), decisions in
  [ADR 0002](../adr/0002-import-center-reference-host.md)
- Date: 2026-10-26 (container clock)
- Accepted base: `origin/feature/import-center` at `82afe74f` ("docs: define import center reference host")
- Implementation branch: `claude/busy-newton-mx3fgc` (the session-assigned branch; the requested
  `work/import-center-implementation` name was created locally at `82afe74` and fast-forwarded into it)
- Pull request: head `claude/busy-newton-mx3fgc` -> base `feature/import-center` (not merged)
- Starting commit: `82afe74`
- Implementation commit: `959b8c4` (`feat(fixture): local Import Center reference host`)
- Final commit: the head of the pull request, which is this handoff's own commit on top of `959b8c4`. A file
  cannot contain its own hash; read it from `git log -1` or the PR.

## Delivered behavior

All inside `fixtures/next-supabase`. `features/import-center/feature.json`, `packages/contracts`, `apps/cli`, the
root `package.json`, `pnpm-workspace.yaml` and the manifest were not changed.

| Requirement | Where | Notes |
| --- | --- | --- |
| Supabase Auth, `tenants`, `tenant_members` (`admin`/`member`) | migration, `seed.sql` | Three local seed users (admin A, member A, admin B). Self sign-up is disabled in `config.toml`. |
| RLS on every tenant-owned table | migration | `tenants`, `tenant_members`, `imports`, `import_row_errors`, `import_records`. Policies use `auth.uid()` through `is_tenant_admin()`. Client roles also have table privileges revoked down to `SELECT` (`anon`: none), so RLS is not the only barrier. |
| Admin-only create/start/replay/download | `start_import`, `replay_import` (SECURITY DEFINER, re-check admin), `GET /api/imports/[id]/errors` | A foreign or missing import returns the same not-found result. |
| Private upload bucket | migration | `import-uploads`, private, 5 MiB, `text/csv`. Insert/select policies require admin of the tenant in the first path segment. No update or delete policy; Storage also blocks direct SQL deletes. |
| CSV upload, mapping, preview, start | `app/imports/new`, `src/components/import-wizard.tsx`, `src/import-center/*`, `app/api/imports/*` | Preview writes nothing. Start re-validates from the stored file; the preview is never trusted. |
| Duplicate policy | `normalizeKeyPart` / `buildDedupeKey`, `commit_import_batch`, `unique (tenant_id, dedupe_key)` | First row wins; later same-key rows are skipped and persisted as `duplicate_in_file` / `duplicate_existing`; stored data is never overwritten. Full text in the fixture README. |
| `pgmq` queue, bounded batches | `import_center_jobs`, `src/import-center/worker.ts` | 100 rows per batch. One message in, one batch committed, one continuation message out. |
| Transactional cursor/status/counts/errors | `commit_import_batch` | One transaction. Applies only if `run_id` and `cursor` still match; otherwise `stale` and a no-op. |
| Retry, exhaustion, archive | worker + `pgmq` visibility timeout | 3 failed deliveries, then the message is archived and the import is `failed` with a fixed sanitized summary. |
| Replay | `replay_import`, replay button | New `run_id`, fresh message at the persisted cursor. Completed imports are never replayed. |
| Progress and safe errors in the UI | `/imports`, `/imports/[id]` | Status, progress bar, imported/duplicate/invalid counts, sanitized `error_summary`, row-error table, CSV download. |
| No secrets in the UI | verified | The browser run asserts no keys or local ports appear in rendered HTML. The service-role key has no `NEXT_PUBLIC_` prefix and is only read by the worker. |
| Local worker command/endpoint | `POST /api/internal/import-worker`, "Run worker once" control | Bearer secret (constant-time compare); disabled if `IMPORT_WORKER_SECRET` is unset. The dev control needs `IMPORT_CENTER_DEV_CONTROLS=true` **and** a loopback Supabase URL. Nothing runs the worker on a schedule. |

## Dependencies (all exact-pinned, fixture-scoped, used)

| Package | Version | Why |
| --- | --- | --- |
| `csv-parse` | `7.0.3` | CSV parsing (`csv-parse/sync`) with bounded record size. |
| `@supabase/ssr` | `0.12.7` | Cookie-session server client and `proxy.ts` refresh. |
| `supabase` (dev) | `2.122.0` | Local stack, migrations, `db reset`, `test db`. |
| `pg` / `@types/pg` (dev) | `8.23.1` | Integration test assertions on `pgmq` queue/archive tables. |
| `vitest` (dev) | `5.0.5` | Same pin as the rest of the workspace; now also declared by the fixture. |

Versions were taken from `npm view` on the day of implementation. **Rationale caveat:** ADR 0002 asks for
"current official-documentation rationale". I did not re-read vendor documentation online. For `proxy.ts` I used
the documentation bundled with the installed Next `16.4.3`, and for the `@supabase/ssr` cookie contract
(including the `setAll` cache headers) I read the installed package's type definitions. The reasons above are
functional, not a citation of current docs; a reviewer should confirm the pins against the docs.

The lockfile diff adds only the fixture importer and the transitive packages these dependencies need.
pnpm 10 did not block the `supabase` CLI binary in this environment, so no root `onlyBuiltDependencies`
change was needed.

## Migration and effect notes

- One migration: `supabase/migrations/20261027000000_import_center.sql`. It enables the `pgmq` extension,
  creates the five tables, helper functions, RLS, grants, the bucket and its policies, the queue, and the
  user-facing and worker functions.
- Worker functions (`import_queue_*`, `commit_import_batch`, `record_import_attempt_failure`, `fail_import`) are
  executable by `service_role` only. `pgmq` schema privileges are revoked from `anon`/`authenticated`.
- `start_import` stores the caller-supplied checksum and row count; the worker re-checks both against the actual
  file and fails the import permanently on mismatch, so a wrong value can only harm the admin's own import.
- `supabase/config.toml` is committed. Realtime, Studio, local SMTP, Edge Runtime, analytics, the S3 protocol and
  Storage Vector are disabled to keep the local stack small; Auth, Storage, Postgres and the API are on.
- Seed data and demo credentials are fixed, non-sensitive and local only. The well-known Supabase local demo keys
  were printed by `supabase start`/`status` in my terminal output but are not committed.
- No remote command was run: no `supabase link`, `db push`, or hosted URL.

## Verification

All run from a freshly created local stack (`supabase stop --no-backup`, then `supabase start`, then
`supabase db reset --local`). Paths are relative to the repository root unless noted.

| Command | Result |
| --- | --- |
| `cd fixtures/next-supabase && pnpm exec supabase stop --no-backup && pnpm exec supabase start` | Passed. Migration and seed applied on a fresh database. |
| `cd fixtures/next-supabase && pnpm exec supabase db reset --local` | Passed. Migration and seed re-applied from scratch. |
| `cd fixtures/next-supabase && pnpm supabase:test:db` (`supabase test db --local`) | **Passed: 73/73 pgTAP tests.** Positive admin access; negative tenant B, non-admin member and anonymous access on all five tables and the upload path; direct-write denial; `start_import`/`replay_import` authorization and state rules; worker functions and `pgmq` not callable by sessions; batch-commit semantics (in-file duplicate, duplicate of a prior import, invalid row, stale cursor/run, completion). |
| `cd fixtures/next-supabase && pnpm test` | **Passed: 3 files, 29 tests** (CSV parsing, mapping, validation, normalized keys, duplicate preview, error CSV including formula-injection neutralization). |
| `cd fixtures/next-supabase && pnpm test:integration` | **Passed: 13/13** against local Auth, Storage, Postgres and `pgmq`. |
| `pnpm test` | Passed. fixture 29, contracts 2, CLI 3. |
| `pnpm typecheck` | Passed (CLI, contracts, fixture). |
| `pnpm lint` | Passed. Biome checked 48 files, no findings. |
| `pnpm build` | Passed. Next `16.4.3` built the new routes and the Proxy. |
| `pnpm inspect:fixture` | Passed after `pnpm install --frozen-lockfile` re-linked the `feature` bin (see Failures). Still `supportAssessment: not-determined`. |

### What the integration test proves

- Valid import of 250 rows in three batches; progress persisted at 100, 200, 250; counts add up to the cursor.
- Invalid headers, malformed CSV, header-only file, and an unmapped key column are rejected.
- Duplicate policy across two imports: case/whitespace-insensitive duplicate of a completed import is skipped,
  persisted as `duplicate_existing`, and the stored payload is unchanged.
- **Interruption after rows are committed:** batch 1 commits; a simulated crash before batch 2's commit persists
  nothing; on redelivery batch 2 commits and the process dies before the acknowledgement; the stale message is
  then discarded and batch 3 completes. Result: exactly 250 records, none duplicated, queue empty.
- Retryable failure stores only a fixed summary (a thrown error containing an email and a password is not
  persisted), then recovers on redelivery.
- Retry exhaustion: three retries, then `failed`, message archived. Replay by a different tenant's admin is
  refused; replay by the owner resumes from row 101 under `run_id` 2 and completes with 250 records. The first
  100 record ids are identical before and after (not re-inserted).
- Completed imports cannot be replayed. A file altered after validation fails permanently (checksum) without
  importing anything.
- Tenant B admin, tenant A non-admin member, and anonymous callers cannot read the import, its errors or records,
  download its upload, replay it, upload into tenant A, or start an import against its path; sessions cannot call
  worker functions.
- A mutation check (not committed): disabling the worker's stale-cursor guard made the interruption test fail,
  while the database commit guard still prevented data corruption.

### Browser run (manual, not committed)

I drove the built app in Chromium with a Playwright script kept outside the repository: sign in, upload a
232-row CSV, map columns, choose the key, preview ("230 of 232 rows will be imported ... Nothing has been
written yet"), start (shows **Queued**, not run inline), run the worker three times (100, 200, 232 of 232),
download the error CSV (2 errors), see the job in the list, and confirm no key or port appears in the HTML.
Then tenant B got 404 for the import page and the error download, tenant B's list did not include it, the
non-admin member was refused (403), and anonymous access got 401. All 15 checks passed on the final build.
This is not an automated repository test: Playwright is not a declared dependency and adding one was not
authorized.

## Failures, retries, and skipped checks

- **Docker daemon was not running** at session start (`failed to connect to the docker API at
  unix:///var/run/docker.sock`). I started `dockerd` inside the container; that is an environment action, not
  a repository change. Image pulls from `public.ecr.aws` printed `Data limit exceeded` and retried; the pulls
  eventually succeeded (the `pg_prove` image came from `ghcr.io`). Nothing was skipped because of Docker.
- Early `supabase test db` runs failed on mistakes in my own tests, fixed without weakening assertions: a
  data-modifying `WITH` inside a subselect (replaced by an invoker-rights helper), an expected SQLSTATE of
  `P0001` where Storage raises `42501`, and a wrong plan count. I also first set `[auth.email] enable_signup =
  false`, which disables the email provider entirely; corrected to the global `[auth] enable_signup = false`.
- `pnpm inspect:fixture` first failed with `feature: not found`: pnpm could not link the `feature` bin during
  install because the CLI had not been built yet. Re-running `pnpm install --frozen-lockfile` after `pnpm build`
  fixed it with no lockfile change.
- Not run: any hosted or remote Supabase check, a production build against a real deployment, and load or
  concurrency testing.

## Known limitations

- **No cancellation.** The first brief asked for cancelling running imports; the approved task and ADR do not
  include it, so I did not add one. A failed import can be replayed; an active one cannot be stopped.
- **Admin-only.** Per the approved task, a non-admin member cannot list or view imports. A member-facing job
  list (the first brief's "current user's jobs") would need a task change.
- No UI kit exists in the fixture, so the UI is plain React with one small stylesheet.
- The worker is manual: a deliberate endpoint/control only, no scheduler, and no claim of autonomous production
  execution. The queue visibility timeout is 30 seconds; throughput was not measured.
- Each batch re-downloads and re-parses the whole file (bounded by 5 MB and 10,000 rows) and slices its rows.
  Simple and stateless, but quadratic-ish for the largest files.
- Multiple concurrent workers are guarded by a row lock plus the run/cursor check, but were not load tested.
- UTF-8 only; invalid byte sequences are replaced rather than rejected.
- Uploaded files, `pgmq` archive rows and completed imports have no retention or cleanup.
- Tenant and member management is seed-only. There is no UI to create tenants or change roles.
- Policies, Storage behavior and `pgmq` privileges were verified on the local stack only, not on a hosted project.
- Installer templates, target-domain mapping, remote Supabase, scheduling and webhooks remain deferred per the
  task.

## Git state

- Base: `origin/feature/import-center` = `82afe74`. `main` = `f697f31` and was not touched.
- Nothing was committed to `feature/import-center` or `main`, and no other agent's branch was used.
- The pull request targets `feature/import-center` and is left unmerged.
