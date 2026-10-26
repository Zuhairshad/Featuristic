# PR feedback automation base synchronization

- Status: Approved documentation-maintenance follow-up
- Owner: Claude B
- Branch: update existing `claude/pr-feedback-automation-design-b` / PR #3

## Objective

Synchronize PR #3 with the current `feature/import-center` base without changing its Proposed design. The branch
currently predates canonical coordination commits, making GitHub show unrelated deletions in its comparison. The
final PR diff must be limited to the automation-design files and Claude B's outgoing status note.

## Authorized operation and paths

1. Fetch `origin` and merge the current `origin/feature/import-center` into the existing PR #3 branch with a
   normal merge commit. Do **not** rebase, force-push, or merge any PR.
2. Preserve canonical coordination files exactly if conflicts occur. Do not alter code, workflows, secrets,
   dependencies, manifests, contracts, tasks, or another agent's mailbox.
3. You may update only `docs/handoffs/pr-feedback-automation.md` to record the synchronization commit and
   verification. Do not change ADR 0003's content in this task.

## Verification and handoff

Run `git diff --check origin/feature/import-center...HEAD` and inspect
`git diff --name-only origin/feature/import-center...HEAD`. The final comparison must contain only
`docs/adr/0003-pr-feedback-automation.md`, `docs/handoffs/pr-feedback-automation.md`, and (if already present)
`docs/coordination/questions/claude-b.md`. Push the existing branch, update the handoff with the base, merge
commit, final head, and command results, then hold PR #3 for the independent review. Do not add a PR comment or
modify a mailbox in this task.
