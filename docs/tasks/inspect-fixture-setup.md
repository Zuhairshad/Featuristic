# Repair fixture inspection setup

- Status: Approved for a focused bug fix
- Owner: Claude A
- Branch and PR: `claude/busy-newton-mx3fgc` → `feature/import-center`, PR #1
- Evidence: Claude B independently reproduced a first-run failure of `pnpm inspect:fixture` after the documented
  `pnpm install --frozen-lockfile` then `pnpm build` sequence. A second install links the CLI bin and makes the
  command pass.

## Objective

Make the documented root setup sequence work without a second install: after a clean `pnpm install
--frozen-lockfile` and `pnpm build`, `pnpm inspect:fixture` must succeed.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `package.json` | Make the root inspection script invoke the built CLI deterministically. |
| `README.md` | Change only if the exact setup command needs clarification. |
| `docs/handoffs/import-center.md` | Record the fix, verification command, and Git state. |

Do not change dependencies, the lockfile, the CLI's inspection behavior, fixture source, Supabase configuration,
or feature scope. Do not alter remote resources, credentials, or production settings.

## Required work and verification

1. Reproduce the failure from a clean disposable checkout using the documented ordering.
2. Change the root script so it invokes the built CLI without depending on a pnpm-created `feature` bin that may
   be absent before a post-build reinstall.
3. From a clean disposable checkout, run `pnpm install --frozen-lockfile`, `pnpm build`, then
   `pnpm inspect:fixture` exactly once. Record observed exit results.
4. Run the root `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` checks. Review the full diff before
   committing. Post exact evidence on PR #1.

If the expected failure cannot be reproduced, record that result and do not broaden the change.
