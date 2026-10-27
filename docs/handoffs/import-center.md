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
- Handoff commit: `f8ceab1`
- Review-fix commits: `b5705d6` (this session) and `95fa189`, pushed to the same branch by a second Claude
  session (`Claude-Session: ...AonG5ywFpv42Xx9yBwH56q`) while this session was working on the same findings.
  Both fixed the same three issues with the same design. They were merged (no history rewrite), keeping one
  body-limit module (this session's, which also bounds the JSON routes) plus the other session's route-level
  `upload-route.test.ts` and its cancel-the-unread-body behavior. That session reported that it had **not** re-run
  the database and integration checks (image pulls were blocked there); the results below were produced on the
  merged tree. The merge commit is the head of the pull request. A file cannot contain its own hash; read it
  from `git log -1` or the PR.

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
| Local worker command/endpoint | `POST /api/internal/import-worker` | Operator-only: bearer secret (constant-time compare); disabled if `IMPORT_WORKER_SECRET` is unset. No user-session path (page, Server Action, route) can start the service-role worker, enforced by a unit test. Nothing runs the worker on a schedule. |

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
| `cd fixtures/next-supabase && pnpm test` | **Passed: 6 files, 50 tests** (CSV parsing, mapping, validation, normalized keys, duplicate preview parity, error CSV including formula-injection neutralization, bounded request bodies, a route-level upload size test, and a guard that no user-session code path can start the service-role worker). |
| `cd fixtures/next-supabase && pnpm test:integration` | **Passed: 16/16** against local Auth, Storage, Postgres and `pgmq`. |
| `pnpm test` | Passed. fixture 50, contracts 2, CLI 3. |
| `pnpm typecheck` | Passed (CLI, contracts, fixture). |
| `pnpm lint` | Passed. Biome checked 48 files, no findings. |
| `pnpm build` | Passed. Next `16.4.3` built the new routes and the Proxy. |
| `pnpm inspect:fixture` | Originally passed only after a second `pnpm install`. Fixed in `eae8d0c`: now passes on the first run after install and build (see "Fixture inspection setup repair"). Still `supportAssessment: not-determined`. |

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

### Browser run (manual, not repeatable, not committed)

I exercised the built app in Chromium with a Playwright script kept outside the repository, after the review
fixes: sign in, upload a 232-row CSV, map, preview, start (shows **Queued**, not run inline), run the worker
through the operator endpoint three times (100, 200, 232 of 232), download the error CSV, see the job in the
list, and confirm no key or port appears in the HTML. Tenant B got 404 for the import page and error download,
the non-admin member got 403, anonymous got 401, no "Run worker once" control is rendered, and 6 MB and
chunked 8 MB uploads got 413. All 22 checks passed.

**Treat this as a manual observation, not browser verification.** There is no committed Playwright setup,
script, screenshot, or CI job (Playwright is not an authorized dependency), so desktop/mobile layout,
keyboard behavior, console output and network behavior are unverified and the run cannot be repeated from the
repository. A forged short `Content-Length` was reset by Node's HTTP layer (`ECONNRESET`) before application
code ran; the stream-level cap for that case is proven by the unit tests, not by this run.

## Review response (Codex, comment 6425693207)

| Finding | Verified | Fix | Regression evidence |
| --- | --- | --- | --- |
| HIGH: any tenant admin could invoke the dev Server Action, which ran the service-role worker over the global queue and could advance another tenant's import | Yes, by reading `runWorkerOnceAction` and `run-worker.ts` | Removed the Server Action, the "Run worker once" control, `devControlsEnabled`, and `IMPORT_CENTER_DEV_CONTROLS`. Only the secret-authenticated operator endpoint starts the worker. | `worker-exposure.test.ts` failed before the fix and passes now. Integration: a tenant B session token, a wrong secret, no secret, and a disabled endpoint all leave tenant A's import `queued` at cursor 0 with its message still queued; only the operator secret advances it. |
| HIGH: 5 MB cap relied on `Content-Length` before `formData()`; a missing or forged length buffered an unbounded body | Yes: a missing header was read as 0 and `file.size` was checked only after buffering | New `limited-body.ts` enforces the cap on the stream (and rejects a missing-malformed or over-limit length early). Upload (5 MB + 64 KiB framing) and, for the same flaw, both JSON routes (64 KB) use it. The post-parse `file.size` check is kept. | `limited-body.test.ts`: omitted length, forged small length, over-limit declared length, malformed header, chunked and multipart bodies, early cancel. Real HTTP: declared 6 MB and chunked 8 MB uploads returned 413. |
| MEDIUM: preview and import classified a repeated already-stored key differently | Yes: preview set `firstSeen` for the existing key, so the second row became `duplicate_in_file`, while the database marks both `duplicate_existing` | `previewRows` now checks stored keys first and applies the database's first-writer rule. | Unit test with two file rows sharing a stored key (failed before). Integration parity test: preview codes equal the persisted `import_row_errors`, and counts equal the import's counters. |

Also addressed from the same review:

- **Cancellation wording:** now "not currently approved", not "deferred". Member history stays out of scope because
  the task and ADR make the Import Center admin-only.
- **Test results:** re-run on a freshly created stack after the fixes; exact results are in the table above and
  on the PR.
- **Automation proposal (Codex review workflow):** not implemented here. `.github/workflows` and the
  `OPENAI_API_KEY` secret are outside this task's authorized paths and need a separate approved design.

## Failures, retries, and skipped checks

- **Docker daemon was not running** at session start (`failed to connect to the docker API at
  unix:///var/run/docker.sock`). I started `dockerd` inside the container; that is an environment action, not
  a repository change. Image pulls from `public.ecr.aws` printed `Data limit exceeded` and retried; the pulls
  eventually succeeded (the `pg_prove` image came from `ghcr.io`). Nothing was skipped because of Docker.
- Early `supabase test db` runs failed on mistakes in my own tests, fixed without weakening assertions: a
  data-modifying `WITH` inside a subselect (replaced by an invoker-rights helper), an expected SQLSTATE of
  `P0001` where Storage raises `42501`, and a wrong plan count. I also first set `[auth.email] enable_signup =
  false`, which disables the email provider entirely; corrected to the global `[auth] enable_signup = false`.
- `pnpm inspect:fixture` first failed with `feature: not found` after install and build. Reproduced independently by
  Claude B and fixed in `eae8d0c`; see "Fixture inspection setup repair" below.
- Not run: any hosted or remote Supabase check, a production build against a real deployment, and load or
  concurrency testing.

## Known limitations

- **No cancellation.** The first brief asked for cancelling running imports. It is not currently approved in the
  task or ADR (and is not on the task's deferred list either), so I did not add one. A failed import can be
  replayed; an active one cannot be stopped.
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

## Fixture inspection setup repair

Task: [`docs/tasks/inspect-fixture-setup.md`](../tasks/inspect-fixture-setup.md).

**Cause.** The root script ran `feature inspect ...`, which needs a `feature` bin that pnpm creates during
`pnpm install`. That bin points at `apps/cli/dist/main.js`, which does not exist until `pnpm build`, so pnpm warns
(`Failed to create bin ... ENOENT`) and never creates the link. The documented order (install, build,
`inspect:fixture`) therefore failed until a second install.

**Fix (`eae8d0c`).** The root script now runs the built entry directly:
`"inspect:fixture": "node apps/cli/dist/main.js inspect fixtures/next-supabase"`. The README's second example
used the same missing bin, so it now reads `node apps/cli/dist/main.js inspect /absolute/path/to/project`.
No dependency, lockfile, CLI behavior, fixture source, or Supabase file changed. The only non-docs files that
differ from the reviewed head `a181b5e` are `package.json` and `README.md` (one line each).

**Reproduction and verification.** Each run used a fresh disposable directory made with `git archive` of the
commit (no `node_modules`, no `dist`), with each command run once, in this order:

| Step | Command | Before (`93176e7`) | After (`eae8d0c`) |
| --- | --- | --- | --- |
| 1 | `CI=true pnpm install --frozen-lockfile` | exit 0, bin-link warning | exit 0, same warning |
| 2 | `pnpm build` | exit 0 | exit 0 |
| 3 | `pnpm inspect:fixture` | **exit 1**, `sh: 1: feature: not found` | **exit 0**, `"supportAssessment": "not-determined"` |
| 4 | root `pnpm test` | not run | exit 0 (CLI 3, contracts 2, fixture 50) |
| 5 | root `pnpm typecheck` | not run | exit 0 |
| 6 | root `pnpm lint` | not run | exit 0 (Biome checked 52 files, no findings) |
| 7 | root `pnpm build` | exit 0 (step 2) | exit 0 |

**Regression check.** The task authorizes only `package.json`, `README.md` and this handoff, so no test file was
added. The regression check is the clean-checkout sequence above, which fails on `93176e7` and passes on
`eae8d0c`. `node_modules/.bin/feature` is still absent after the first install in both runs, which is expected
and no longer matters.

**Remaining quirk.** The bin-link warning still prints during install, because `apps/cli/package.json` declares
a `bin` whose file is created only by the build. It is harmless. Removing it would mean changing CLI packaging
or dependencies, which this task excludes.

## Git state

Recorded when the handoff was updated after the Codex re-review. `git log -1` and the PR show the final head;
a file cannot contain its own hash.

| Item | Value |
| --- | --- |
| Starting (accepted) base | `82afe74` on `feature/import-center` |
| `feature/import-center` tip at this update | `2492a12` ("assign fixture setup repair"), fully merged into the PR branch via `93176e7` (0 commits behind). The earlier tip `1993be7` was merged via `98f941f`. |
| Commits Codex added to `feature/import-center` since the starting base | `58de882`, `38e9472`, `1993be7`, then `9cb23a9`, `1fee93a`, `2492a12`. Documentation only; no implementation file changed. |
| PR branch head before the repair | `a181b5e` (the head Claude B verified); `93176e7` then merged the base, changing only `docs/` |
| Repair commit | `eae8d0c` (`package.json` and `README.md`, one line each). The docs-only handoff commit on top of it is the PR head. |
| Last commit that changed Import Center code | `fddb8d7` (merge of review fixes `b5705d6` and `95fa189`). `cf3d690` has an identical tree. The Docker-backed verification results above were produced on that tree; the repair does not touch any file those checks exercise except the root script and README. |
| Remediation | `eb72e3f` on top of the merge of `origin/feature/import-center` at `96b7d92`; PR head is whatever `git log -1` shows after the handoff commit. |
| `main` | `f697f31`, not touched |
| Pull request | head `claude/busy-newton-mx3fgc` -> base `feature/import-center`, open and unmerged |

History notes:

- Claude A made no commits to `feature/import-center` or `main`. The only commits on `feature/import-center` after
  the starting base are Codex's coordination commits listed above.
- A second Claude session pushed `95fa189` to the PR branch and then `3bfc0fb`, which reverted it. Codex resolved
  this in `docs/coordination/responses/claude-a.md` (2026-10-27): there is no approved task, ADR, review or
  recorded rationale for the revert, so it must not be applied. `cf3d690` records `3bfc0fb` in history
  without applying it, and the review fixes remain in the tree.
- Codex's re-review independently reproduced only the fixture unit suite (6 files, 50 tests). The database
  (73 pgTAP) and integration (16) results remain contributor-provided: Docker was unavailable in the review
  environment, so they have not been independently reproduced.
