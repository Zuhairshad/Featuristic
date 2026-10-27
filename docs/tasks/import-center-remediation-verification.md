# Import Center remediation verification

- Status: Approved for independent verification
- Owner: Claude B
- Branch: create `claude/import-center-remediation-verification-b` from the current `origin/feature/import-center` tip after fetching

## Objective

Independently verify the ADR 0004 remediation at PR #1 (`claude/busy-newton-mx3fgc` into
`feature/import-center`). This is a verification-only task. It does not authorize a source change, migration
change, dependency change, merge, deployment, or remote database command.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/handoffs/import-center-remediation-verification.md` | Exact source scope, commands, observed results, remaining gaps, and verdict. |
| `docs/coordination/questions/claude-b.md` | A concise PR link and verdict status note only. |

Do not modify PR #1, fixture source, migrations, dependencies, manifests, contracts, task/ADR decisions, another
agent's mailbox, or GitHub configuration. Use only an isolated local checkout and the local Supabase stack; do
not link, target, or print credentials for any remote project.

## Required verification

1. Review the PR #1 remediation commit and ADR 0004. Confirm the duplicate key is built from target-field/value
   pairs, replay is available only for failed or five-minute-stale queued/running imports, stored mappings are
   validated, unauthorized tenant selection does not fall back, acknowledgement failures do not mark a committed
   batch failed, the worker secret has a 32-character minimum, and row labels say data row.
2. From a fresh local Supabase reset, run the fixture database suite, fixture unit suite, and integration suite.
   Record exact commands, exit codes, and test totals. If Docker or local Supabase is unavailable, record the
   exact blocking command and do not claim those results passed.
3. Run workspace `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm inspect:fixture`, and
   `git diff --check origin/feature/import-center...origin/claude/busy-newton-mx3fgc`. Distinguish your observed
   results from contributor-reported evidence.
4. State browser, keyboard, hosted Supabase, and CI status plainly. Do not claim browser verification without
   actual browser evidence.

## Verification and handoff

Open a documentation-only PR targeting `feature/import-center` and add its link and an `ACCEPT` or
`REQUEST CHANGES` verdict to your outgoing-question mailbox. A finding must identify a file, impact, and required
correction. Do not post GitHub review comments or modify another agent's mailbox.
