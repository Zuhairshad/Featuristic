# Import Center final-review remediation

- Status: Approved for implementation
- Owner: Claude A
- Branch: update existing `claude/busy-newton-mx3fgc` / PR #1 after merging current `origin/feature/import-center`
- Decision: ADR 0004

## Objective

Resolve the required Import Center final-review findings from PR #6 while keeping PR #1 a local-only reference
host. This task authorizes only the changes required by ADR 0004 and the associated tests and handoff evidence.

## Authorized paths and operations

| Path or operation | Authorization |
| --- | --- |
| `fixtures/next-supabase/app/**`, `src/**` | Duplicate-key, replay/recovery, tenant-selection, acknowledgement, secret-validation, and row-number fixes plus focused tests. |
| `fixtures/next-supabase/supabase/migrations/20261027000000_import_center.sql` | Amend the unmerged fixture migration so uniqueness and replay logic match ADR 0004. |
| `fixtures/next-supabase/supabase/tests/**`, `fixtures/next-supabase/tests/**` | pgTAP and local integration coverage for the new behavior. |
| `fixtures/next-supabase/README.md`, `.env.example` | Accurate local-only operator-secret and row-number guidance, if affected. |
| `docs/handoffs/import-center.md` | Updated exact verification, Git state, and remaining browser/CI limits. |

Merge current `origin/feature/import-center` into the existing PR branch with a normal merge before editing;
preserve canonical coordination files. Use only the local Supabase stack. Do not link, push, or target a remote
database; do not add feature installation, hosted scheduling, webhooks, production credentials, or dependencies.

## Required behavior and tests

1. Implement ADR 0004's target-field-namespaced key in every preview, worker, and persistence path. Add a test
   where different selected target fields have the same normalized value and both records import.
2. Record failure before queue archival, expose replay for a stale `queued`/`running` import, and add pgTAP plus
   integration coverage that proves a stale import replays without duplicate records.
3. Validate persisted mapping in the worker; reject a supplied unauthorized tenant without fallback; do not mark
   an import batch failed merely because acknowledgement fails after a successful commit; enforce the 32-character
   local worker-secret minimum; label row-number semantics where users see them.
4. Retain the previously fixed service-role worker boundary, bounded streamed-body reads, and preview/persistence
   parity. Do not weaken their tests.

## Verification and handoff

On a fresh local stack run the database suite, fixture unit tests, fixture integration tests, workspace
`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and `pnpm inspect:fixture` after a single clean install
and build. Review the full diff, run `git diff --check`, record exact results in the handoff, and open no new PR:
update PR #1 only. Browser/CI verification remains explicitly unverified unless actually run.
