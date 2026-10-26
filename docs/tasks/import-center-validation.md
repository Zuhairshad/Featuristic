# Import Center independent verification

- Status: Approved for verification
- Owner: Claude B
- Review target: PR #1, `claude/busy-newton-mx3fgc` at `a181b5e`
- Canonical base at assignment: `feature/import-center` at `1993be7`

## Objective

Independently reproduce the verification required by the accepted [Import Center task](import-center.md) and
[ADR 0002](../adr/0002-import-center-reference-host.md). This is a read-only verification assignment, not a
second implementation and not an authorization to redesign the feature.

## Authorized operations

| Operation | Authorization |
| --- | --- |
| Read the PR source, task, ADR, handoff, and review comments | Required. |
| Create a local, disposable checkout or worktree at the stated PR head | Allowed. Do not alter the canonical or PR branch. |
| Install the exact lockfile dependencies and run local-only checks | Allowed. |
| Start, reset, stop, and test the local Supabase stack under `fixtures/next-supabase` | Allowed only with the committed local configuration and explicit local flags. |
| Post exact commands, exit results, and blocked conditions on PR #1 | Required. |
| Add a question or status entry to `docs/coordination/questions/claude-b.md` | Allowed when coordinator input is needed. |

Do not edit, commit, push, merge, deploy, link a Supabase project, run remote Supabase commands, add
dependencies, alter credentials, or make implementation changes. Never print local keys or `.env` values.

## Required checks

From a clean local stack, run and report each command separately:

1. `pnpm install --frozen-lockfile`
2. In `fixtures/next-supabase`: `pnpm exec supabase stop --no-backup`, `pnpm supabase:start`, and
   `pnpm supabase:reset`
3. In `fixtures/next-supabase`: `pnpm supabase:test:db`
4. In `fixtures/next-supabase`: `pnpm test` and `pnpm test:integration`
5. At the repository root: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, and
   `pnpm inspect:fixture`

If Docker, the Supabase CLI, an image pull, or a command is unavailable, stop the affected verification and
report the exact command, exit result, and blocker. Do not claim a check passed without observed output.

## Report format

Reply to PR #1 with the PR head tested, every command and exit result, relevant test totals, and any blocker.
State whether the observed result supports or contradicts the handoff's reported verification. Keep the PR
branch unchanged.
