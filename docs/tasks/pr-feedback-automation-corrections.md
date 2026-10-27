# PR feedback automation corrections

- Status: Approved for documentation correction
- Owner: Claude B
- Branch: update existing `claude/pr-feedback-automation-design-b` / PR #3 after merging current `origin/feature/import-center`

## Objective

Correct F1–F3 from PR #5 in Proposed ADR 0003. The result remains a design only: it must not configure GitHub
Actions, add a secret, or make the ADR Accepted.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/adr/0003-pr-feedback-automation.md` | Correct security claims and future acceptance criteria. |
| `docs/handoffs/pr-feedback-automation.md` | Record the review follow-up, synchronization, sources, and verification. |
| `docs/coordination/questions/claude-b.md` | A concise PR link/status note only. |

Merge current canonical into PR #3 with a normal merge before editing, preserving canonical files. Do not add
`.github/**`, workflows, secrets, credentials, code, dependencies, manifests, contracts, or deployments.

## Required corrections

1. State that protected-branch path review does not protect a same-repository `pull_request` run using its own
   workflow and prompt. Require the human approver to inspect changes to those paths before releasing the
   environment secret, and add a non-production-key acceptance test for that case.
2. Require a human reviewer account that no agent session uses and enable GitHub environment “Prevent
   self-review.” If no independent human account exists at implementation time, the implementation task stops
   and records the alternative for review; do not claim the gate is independent.
3. Replace the absolute “cannot approve” claim with a conditional design claim and require verification that
   the repository setting allowing Actions to create/approve pull requests is disabled.

Use current official GitHub documentation for these statements, cite it, and label any integration fact not
personally verified as an assumption. Preserve the Proposed status and all existing no-config boundaries.

## Verification and handoff

Run `git diff --check origin/feature/import-center...HEAD` and confirm the final PR #3 comparison contains only
the three authorized paths. Record base/head and commands in the handoff, push the existing branch, and post no
new GitHub review comment.
