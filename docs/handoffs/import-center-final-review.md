# Import Center final code review handoff

- Task: [`docs/tasks/import-center-final-review.md`](../tasks/import-center-final-review.md)
- Reviewer: Claude B
- Subject: PR #1, `claude/busy-newton-mx3fgc` into `feature/import-center`, author Claude A
- Review branch: `claude/import-center-final-review-b`, created from `origin/feature/import-center` at
  `93be4345430860039bd67df9756406b0644e0e7a`
- PR #1 head reviewed: `6d4d17d6451df74c545afaa03bfcd76556e349e6`
- PR #1 merge base with canonical: `2492a121531899e42dfff5e6c639881600b470f6`; canonical tip at review:
  `93be434`
- Method: static review of the full PR #1 diff and source read from a disposable export of the head commit. No
  source file, test, migration, dependency or PR #1 content was changed.

## Verdict: CHANGES REQUESTED (two Medium findings; five Low or Info)

The three security fixes that Codex required (no tenant-facing worker trigger, bounded pre-parse request reads,
preview/persisted duplicate parity) are present in the source and have matching tests. I found no tenant
isolation, RLS, Storage-visibility or secret-exposure defect. The two Medium findings concern duplicate-key
correctness (F1) and recovery of an interrupted import through the UI (F2). F1 follows ADR 0002's wording, so it
needs a coordinator decision rather than a plain bug fix. The remaining findings are non-blocking.

Nothing below claims a check passed that I did not run. See "What I ran" and "Not verified".

## Findings

### F1 (Medium, needs a coordinator decision): the duplicate key is not namespaced by key columns

- Files: `fixtures/next-supabase/src/import-center/validation.ts:83-90` (`normalizeKeyPart`, `buildDedupeKey`);
  `fixtures/next-supabase/supabase/migrations/20261027000000_import_center.sql:115` (`unique (tenant_id, dedupe_key)`).
- What the code does: the key is `JSON.stringify` of the normalized values of the chosen key columns, with no
  column or payload-key name. One uniqueness constraint covers every import in the tenant, whatever columns each
  import chose.
- Failure scenario: import 1 uses key column `Email` and stores `["a@x.test"]`. A later import of a different
  dataset chooses `Username` as its key, and a row has `Username = a@x.test`. Its key is also `["a@x.test"]`,
  so the row is skipped as `duplicate_existing` and persisted as a row error, although it is a different
  entity. Rows are silently dropped (and the preview reports the same, so the user is not misled about the
  result, but the outcome is wrong).
- Why this needs a decision: ADR 0002 says "the normalized selected values form a tenant-scoped duplicate key",
  so the code matches the ADR literally. The ADR does not address mixed key schemas in one `import_records`
  table.
- Required correction (choose one): (a) make the key include the sorted payload-key names, for example
  `JSON.stringify([[targetKey, normalizedValue], ...])` ordered by target key, applied in the one shared
  function so preview and the database stay in agreement, and add a test with two imports using different key
  columns and equal values; or (b) amend the ADR to state that the duplicate namespace is tenant-wide and
  key-column-agnostic, and surface that in the preview text. Existing stored keys would need a migration under
  option (a), which is a separate approved task.

### F2 (Medium): an interrupted import that lost its queue message has no UI recovery path, and the database path is untested

- Files: `fixtures/next-supabase/app/imports/[id]/page.tsx:35` (`canReplay = row.status === "failed"`);
  `.../migrations/20261027000000_import_center.sql:281-286` (`replay_import` also permits `queued`/`running`
  with `heartbeat_at` older than 5 minutes); `fixtures/next-supabase/src/import-center/worker.ts:132-134` and
  `:200-203` (the message is archived **before** `failImport`).
- Failure scenario: after retries are exhausted (or a permanent error), the worker archives the message and then
  calls `failImport`. If the process dies or `failImport` errors between the two, the message is gone and the
  import stays `running` with a stale heartbeat. The database would accept a replay after 5 minutes, but the
  page shows the Replay button only for `failed`, so a user cannot recover it from the UI. The task requires an
  admin to "replay a failed or interrupted import".
- Test gap: neither `supabase/tests/database/import_center.test.sql` nor `tests/integration/import-center.itest.ts`
  exercises the stale-heartbeat replay branch (the tests replay only `failed` imports and assert that a
  fresh queued import and a completed import are not replayable).
- Required correction: (a) in `worker.ts`, call `failImport` before `archive` in both places. A crash between the
  two then leaves a redeliverable message that the guard turns into a harmless no-op; (b) include `heartbeat_at`
  in the summary columns and offer Replay when the status is `queued` or `running` and the heartbeat is older
  than 5 minutes; (c) add a pgTAP and an integration test for the stale replay branch.

### F3 (Low): the worker and `start_import` trust the stored mapping

- Files: `fixtures/next-supabase/src/import-center/worker.ts:149-160` (uses `record.mapping` unvalidated);
  `.../migrations/20261027000000_import_center.sql:233-242` (checks only JSON types and that key columns are
  mapped keys).
- Failure scenario: `validateMapping` runs only in `service.ts`. A tenant admin who calls the `start_import` RPC
  directly can persist a mapping whose payload keys break the field-name rule, or whose headers are not in the
  file. Impact is limited to that admin's own tenant data shape (the header, row count and checksum are
  re-checked against the file), so this is defense in depth rather than a cross-tenant issue.
- Required correction: have the worker call `validateMapping(record.header, record.mapping, record.key_columns)`
  before processing and fail permanently with a fixed summary if it reports problems, or enforce the same rules in
  the database.

### F4 (Low): a requested tenant the caller does not administer falls back to another tenant

- File: `fixtures/next-supabase/src/server/session.ts:51-54`.
- Behavior: `admin.find(row => row.tenant_id === requestedTenantId) ?? admin[0]`, and the membership query has
  no `ORDER BY`. A request naming a tenant the caller does not administer is processed against whichever
  administered tenant comes first, and for a multi-tenant admin the default tenant is arbitrary.
- Impact: not a cross-tenant leak, since the caller administers the fallback tenant, and RLS and the database
  functions still apply. It can send an upload or start request to an unintended tenant of the same user.
- Required correction: when a tenant id is supplied and is not among the caller's administered tenants, return
  the same 403 or 404 as other denials; add a deterministic `ORDER BY` for the default.

### F5 (Low): an acknowledgement failure after a successful commit is recorded as a batch failure

- File: `fixtures/next-supabase/src/import-center/worker.ts:192` and `:206-208`.
- Behavior: `store.ack` runs inside the `try`. If it throws after `commitBatch` returned `committed`, the
  `catch` calls `recordAttemptFailure`, which increments `attempts` and writes a "will be retried" summary on an
  import that did advance. The next committed batch clears it, and a final batch leaves the import `completed`
  (the update only touches `queued`/`running`), so there is no data effect.
- Required correction: handle an `ack` failure separately from batch failures and do not call
  `recordAttemptFailure` for it; the stale redelivery is already discarded safely.

### F6 (Low): the operator secret has no minimum strength

- File: `fixtures/next-supabase/src/server/env.ts:34-36`; `.../app/api/internal/import-worker/route.ts`.
- Behavior: any non-empty `IMPORT_WORKER_SECRET` enables the endpoint. The comparison itself is constant-time
  (digest then `timingSafeEqual`) and the endpoint is disabled when unset, so this is a hardening gap only.
- Required correction: treat a secret shorter than a stated minimum (for example 32 characters) as not
  configured, and document it in the fixture README.

### F7 (Info): error row numbers count data records, not file lines

- File: `fixtures/next-supabase/src/import-center/csv.ts:44` (`skip_empty_lines: true`).
- Behavior: blank lines are dropped before numbering, so `row_number` in the UI and error CSV is the data-row
  index and can differ from the line number in the user's file.
- Suggested correction: state "data row number (header excluded, blank lines ignored)" in the README and the
  error CSV header or UI, or number by source line.

## Required review focus: results

### 1. Tenant isolation (static, independently confirmed)

- The only importer of `src/server/run-worker.ts` is `app/api/internal/import-worker/route.ts`, and the only
  importers of `service-client` are `service-client.ts` and `run-worker.ts` (checked with `grep` over `app/` and
  `src/`, excluding tests). The two files that contain `"use server"` are `app/imports/[id]/actions.ts` and
  `app/login/actions.ts`; neither references the worker or the service client. `SERVICE_ROLE` is read only in
  `src/server/env.ts`, with no `NEXT_PUBLIC_` prefix.
- Every user-facing route and page (`api/imports`, `preview`, `upload`, `[id]/errors`, the three `app/imports`
  pages) calls `requireAdmin` or `getSessionState`; reads go through the session client, so RLS applies. The
  replay path is the `replay_import` function, which re-checks tenant admin membership and returns one error
  for missing and foreign imports.
- The internal worker endpoint is disabled when no secret is set and compares a SHA-256 digest of the bearer
  value with `timingSafeEqual`. The committed regression test submits a tenant B session token, a wrong secret,
  no secret, and a disabled endpoint, and asserts tenant A's import stays queued with no records.
- Caveat: `worker-exposure.test.ts` is a source-pattern guard (regular expressions over file text). It will
  catch the removed pattern coming back, but not an unrelated way of building a service-role client (for
  example `createClient` with the key read directly). It is a regression guard, not a proof.

### 2. Request boundaries

- `src/server/limited-body.ts` counts bytes on the stream and cancels at the cap, rejects a malformed or
  over-limit `Content-Length` before reading, and does not rely on the header alone. The upload route calls
  `readUploadForm` (5 MB plus 64 KiB framing) **before** `formData()`, and both JSON routes call
  `readJsonLimited` (64 KB) before `JSON.parse`. The post-parse `file.size` check is kept. Authentication runs
  before any body read. Committed unit tests (`limited-body.test.ts`) and a route-level test
  (`upload-route.test.ts`) cover omitted, forged, over-limit and malformed lengths.
- Remaining limit: there is no per-tenant upload quota or retention, which the handoff already states.

### 3. Import correctness

- Preview and persistence agree: `previewRows` checks stored keys first, matching `commit_import_batch`, and an
  integration test compares preview issue codes and counts with persisted `import_row_errors` and counters.
- Processing is bounded: 100 rows per batch, one message in and one continuation message out, committed in
  one transaction with the cursor and counters; the commit applies only when `run_id`, `cursor` and status
  still match, otherwise it returns `stale`. Replay creates a new `run_id` message at the persisted cursor.
- Imported records are insert-only for API roles (`SELECT` grants only; writes go through service-role
  functions); `unique (tenant_id, dedupe_key)` prevents overwrites. See F1 for the key-scope concern and F2,
  F5 for recovery details.

### 4. Data safety

- Storage: the `import-uploads` bucket is private with a 5 MiB limit and `text/csv`; insert and select policies
  require admin of the tenant in the first path segment; there is no update or delete policy. The worker reads
  files with the service role. No signed or public URL is generated anywhere in `app/` or `src/`.
- Secrets: `.env.example` contains placeholders only; a scan of the head tree for key-shaped strings found none
  outside lockfile and environment-variable references. The service-role key is read server-side only.
- Error exposure: routes return fixed messages through `toErrorResponse`; the worker persists only fixed
  summaries for retryable failures; the Supabase store reports operation name and SQLSTATE only. A permanent
  CSV-format failure persists that error's message; the `duplicate_header` and `empty_header` messages can name a
  header from the admin's own file, but cannot occur after upload because the worker verifies the file checksum
  and header first.
- Error CSV: `csvCell` prefixes `'` for values starting with `=`, `+`, `-`, `@`, tab or carriage return and
  quotes commas, quotes and newlines; the row values column is a JSON string that starts with `{`.

### 5. Setup and evidence

- `inspect:fixture` repair: root `package.json` changes the script from `feature inspect fixtures/next-supabase`
  to `node apps/cli/dist/main.js inspect fixtures/next-supabase`, removing the dependency on a pnpm-created
  `feature` bin. It requires `pnpm build` first; on an unbuilt tree it fails with a missing-file error rather
  than the earlier `feature: not found`. The change touches only the script (it is within the task named in
  `docs/tasks/inspect-fixture-setup.md`).
- Fixture code did not change between `a181b5e` (the head I independently verified) and `6d4d17d`: the diff
  of `fixtures/` between them is empty. The only non-documentation change is the `package.json` script above.

## What I ran

| Command or action | Result |
| --- | --- |
| `git fetch origin` | Canonical tip `93be434`; PR #1 head `6d4d17d`. |
| `git diff --check origin/feature/import-center...origin/claude/busy-newton-mx3fgc` | Exit 0, no whitespace errors. |
| `git diff --stat` of the same range | 56 files, 4,884 insertions, 16 deletions; all under the authorized paths, root `package.json`, `README.md`, `pnpm-lock.yaml`, and docs. |
| `git diff a181b5e 6d4d17d -- fixtures \| wc -l` | `0`: no fixture difference between the head I verified earlier and the current head. |
| Read every changed source, migration and test file in the PR #1 head export | Findings above. |
| `grep` checks for worker, service-client, `"use server"`, `SERVICE_ROLE`, `NEXT_PUBLIC_`, route auth calls, signed/public URL calls, key-shaped strings | Results as stated in the sections above. |

## Not verified

I did **not** run any of the following on the PR #1 head `6d4d17d`: `pnpm supabase:test:db`, the fixture unit
tests, `pnpm test:integration`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, or `pnpm inspect:fixture`. In an
earlier, separate assignment I ran the full local verification on `a181b5e` (73 pgTAP, 50 unit, 16 integration;
workspace test, typecheck, lint, build passed; `inspect:fixture` passed after a second install). Because fixture
code is unchanged since then, that supports the fixture behavior, but it does not cover the changed
`inspect:fixture` script.

- Browser, responsive and keyboard behavior: unverified (no committed browser tooling).
- CI: none exists in the repository.
- Hosted Supabase behavior, load and concurrency behavior: not verified by anyone.
- The planning PDF was not used; this review used only the task, ADR 0002 and PR #1 source.
- Whether the new findings reproduce at runtime: they come from reading the source and are not demonstrated by
  a failing test, except where a missing test is the finding (F2).

## Git state

- Base: `origin/feature/import-center` at `93be4345430860039bd67df9756406b0644e0e7a`.
- This branch adds `docs/handoffs/import-center-final-review.md` and a status note in
  `docs/coordination/questions/claude-b.md`. The PR head is read from `git log -1` or the PR, since a file
  cannot contain its own hash.
- PR #1, its branch, fixture code, migrations, dependencies, tests, contracts, manifests, tasks, ADRs and any other
  mailbox were not changed. No GitHub review was posted and nothing was merged.
