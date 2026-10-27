# Import Center remediation verification handoff

- Task: [`docs/tasks/import-center-remediation-verification.md`](../tasks/import-center-remediation-verification.md)
- Decision under verification: [ADR 0004](../adr/0004-import-center-final-review-refinements.md)
- Verifier: Claude B
- Subject: PR #1, `claude/busy-newton-mx3fgc` into `feature/import-center`, author Claude A
- PR #1 head verified: `7b36da06f3365e85c2d31d79fbe24e73c1b902a8`
- Remediation commit: `eb72e3f` ("fix: remediate Import Center final review per ADR 0004"); later commits
  `34e2957` and `7b36da0` are documentation only
- Review branch: `claude/import-center-remediation-verification-b`, created from `origin/feature/import-center`
  at `30321d2a9de7916d51702ba912a73f317060c57e`
- Method: a read of the remediation diff against ADR 0004, then every required command run by me in a disposable
  `git archive` export of the PR head, on a freshly stopped and reset local Supabase stack. PR #1, its branch, the
  fixture, migrations, dependencies and every other mailbox were not changed. Nothing remote was contacted by a
  Supabase command, and no local key is printed in this file.

## Verdict: ACCEPT

Every ADR 0004 behavior I was asked to confirm is present in the source and is exercised by a test that I ran and
that passed, except two pieces of browser-rendered text that I could only read statically (see "Not verified").
All commands passed. Findings are limited to three non-blocking observations. This verdict does not approve any
browser behavior, hosted Supabase behavior or CI result, none of which I checked.

## Requirement 1: ADR 0004 behaviors, source and test evidence

Paths are under `fixtures/next-supabase/` at the head above. "Test" names a test that I ran and that passed.

| # | Required behavior | Source | Test that exercises it | Result |
| --- | --- | --- | --- | --- |
| 1 | The duplicate key is built from target-field and value pairs, sorted so mapping order does not matter | `src/import-center/validation.ts:92` (`buildDedupeKey` takes `[targetField, value]` pairs, sorts by field, normalizes the value); `:159` builds the pairs from `mapping[column]` | `validation.test.ts` "namespaces the key by target field and ignores mapping order" and "gives the same value under different target fields different keys"; integration "imports both records when different target fields hold the same normalized value (ADR 0004)" runs two real imports and checks both import with `duplicate_count: 0` | Confirmed |
| 2 | Replay is offered only for `failed` or five-minute-stale `queued`/`running` imports | `src/import-center/service.ts:191-199` (`STALE_HEARTBEAT_MS`, `canReplayImport`); `app/imports/[id]/page.tsx:35-36` uses it; the migration's `replay_import` was not changed and already allows the same rule | `service.test.ts` (failed, stale queued/running only after five minutes, never completed); pgTAP "a running import with a fresh heartbeat cannot be replayed", "admin can replay a running import whose heartbeat is stale", "a stale queued import can be replayed too"; integration "lets an admin replay an import whose queue message was lost, without duplicating records" (fresh heartbeat refused by both the UI rule and the database, stale heartbeat accepted, tenant B refused, 250 records, none duplicated) | Confirmed |
| 3 | Failure is recorded before the queue message is archived | `src/import-center/worker.ts:136-137` (exhausted) and `:208-209` (permanent failure): `failImport` then `archive` | `worker.test.ts` "records exhausted failure before archiving the message" and "records a permanent failure before archiving the message" | Confirmed |
| 4 | Stored mappings are validated before processing | `worker.ts:154-155` calls `validateMapping(record.header, record.mapping, record.key_columns)` and raises a permanent error with a fixed summary | `worker.test.ts` "fails permanently, without committing, when the persisted mapping is invalid" | Confirmed |
| 5 | An unauthorized tenant selection does not fall back | `src/server/session.ts:56` (`requestedTenantId ? admin.find(...) : admin[0]`), plus a deterministic `.order("tenant_id")` at `:52`; a named tenant the caller does not administer yields the `not-admin` state | `session.test.ts` "rejects a requested tenant the caller does not administer instead of falling back"; the same file covers the default and a valid selection | Confirmed (unit level, with a mocked client) |
| 6 | An acknowledgement failure does not mark a committed batch failed | `worker.ts:221` runs `store.ack` after the `try`/`catch` in its own `try`, ignoring errors; the batch outcome is computed before it | `worker.test.ts` "does not record a batch failure when only the acknowledgement fails after a commit" | Confirmed |
| 7 | The worker secret needs at least 32 characters | `src/server/env.ts:33-38` (`MIN_WORKER_SECRET_LENGTH`, shorter secret returns `null`, which disables the endpoint) | `env.test.ts` (disabled when unset or shorter than 32, enabled at 32); the integration test's secret was lengthened to 44 characters and its operator-only tests pass | Confirmed |
| 8 | Row labels say data row | `app/imports/[id]/page.tsx:89` and `src/components/import-wizard.tsx:197` ("Data row" with an explanatory title); `src/import-center/error-csv.ts:18` (`data_row_number`) | `error-csv.test.ts` and the integration error-CSV assertion check the new CSV header; no test renders the page or wizard | Confirmed for the CSV; UI text read statically only |

No migration changed in the remediation (`git diff f8ceab1 7b36da0 -- fixtures/next-supabase/supabase/migrations`
is empty). The database already enforced the replay rule; the remediation added tests for it.

## Requirement 2 and 3: commands I ran, with observed results

Run in the disposable export of `7b36da0` (`git archive`), from the stated directory. "Observed" means I ran it
and read the output here. Nothing in this table is copied from the contributor's handoff.

| # | Directory | Command | Exit | Observed |
| --- | --- | --- | --- | --- |
| 1 | root | `CI=true pnpm install --frozen-lockfile` | 0 | Lockfile current; the usual warning that the `feature` bin was not linked because the CLI is unbuilt |
| 2 | `fixtures/next-supabase` | `pnpm exec supabase stop --no-backup` | 0 | Stopped |
| 3 | `fixtures/next-supabase` | `pnpm supabase:start` | 0 | Images pulled and the stack started on the first attempt |
| 4 | `fixtures/next-supabase` | `pnpm supabase:reset` | 0 | "Finished supabase db reset." |
| 5 | `fixtures/next-supabase` | `pnpm supabase:test:db` | 0 | `Files=1, Tests=81`, `Result: PASS` |
| 6 | `fixtures/next-supabase` | `pnpm test` | 0 | 10 files, **65 tests** passed |
| 7 | `fixtures/next-supabase` | `pnpm test:integration` | 0 | 1 file, **18 tests** passed |
| 8 | root | `pnpm test` | 0 | Contracts 2, CLI 3, fixture 65 passed |
| 9 | root | `pnpm typecheck` | 0 | CLI, contracts and fixture all "Done" |
| 10 | root | `pnpm lint` | 0 | Biome checked 51 files, no fixes applied |
| 11 | root | `pnpm build` | 0 | Next `16.4.3` compiled successfully with all import routes |
| 12 | root | `pnpm inspect:fixture` | 0 | First run, straight after install and build with **no second install**; JSON report with `"supportAssessment": "not-determined"` |
| 13 | repository | `git diff --check origin/feature/import-center...origin/claude/busy-newton-mx3fgc` | 0 | No whitespace errors |

The `inspect:fixture` first-run fix works as intended: the sequence install, build, `pnpm inspect:fixture` passed
without the second install that was previously needed.

### Observed against contributor-reported

| Reported figure (PR #1 handoff and coordinator note) | Observed by me |
| --- | --- |
| 65 fixture unit tests | 65 passed (same) |
| Database and integration results | 81 pgTAP and 18 integration passed, on a fresh stack I created |
| Workspace test, typecheck, lint, build, inspect | All passed (same) |

The coordinator's note says Codex reproduced the 65 unit tests and the workspace checks but could not run the
Docker-backed suites; the 81 pgTAP and 18 integration results above are the first independent reproduction of
those two suites that I know of. The earlier totals I verified on an older head (73 pgTAP, 16 integration) grew by
the new remediation tests (8 database and 2 integration), which matches the diff.

## Observations (non-blocking, no correction required)

- **O1.** An empty `tenantId` is treated as "not requested". `src/server/session.ts:56` tests truthiness, and the
  upload route passes a form value of `""` through, so it selects the default administered tenant rather than
  being rejected. It cannot reach a tenant the caller does not administer. If strictness is preferred, treat an
  empty string as invalid input.
- **O2.** The UI computes staleness with the application server's clock (`new Date()` in `page.tsx:35`), while
  `replay_import` uses the database's `now()`. A small clock difference can make the Replay button appear a
  little early or late; the database re-checks the rule, so it cannot permit an invalid replay.
- **O3.** The ignored acknowledgement error is swallowed without any logging (`worker.ts:221-225`). That is
  deliberate and safe for data exposure; if operators need visibility, log the operation name only.

## Not verified

- **Browser, keyboard and responsive behavior.** I did not use a browser, and the repository has no committed
  browser tooling. The "Data row" header text, its tooltip and the "No progress for over 5 minutes" recovery
  banner in `page.tsx` and the wizard are confirmed only by reading the source. I do not claim they render
  correctly.
- **Hosted Supabase.** Everything ran on the local stack only; no remote project was targeted.
- **CI.** None exists in the repository.
- **Load, concurrency and retention** behavior: not tested by anyone.
- **Route-level tenant rejection (item 5).** The session unit test uses a mocked client. The database tenant
  isolation tests passed, but I did not add or run a route-level request for an unadministered tenant.
- The planning PDF was not used.

## Git state

- Base: `origin/feature/import-center` at `30321d2a9de7916d51702ba912a73f317060c57e`.
- This branch adds `docs/handoffs/import-center-remediation-verification.md` and a status note in
  `docs/coordination/questions/claude-b.md`. The PR head is read from `git log -1` or the PR, since a file cannot
  contain its own hash.
- No GitHub review or comment was posted, PR #1 and its branch were not modified, and nothing was merged.
