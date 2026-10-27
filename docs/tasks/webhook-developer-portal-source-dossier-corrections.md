# Webhook Developer Portal source dossier corrections

- Status: Approved for documentation correction
- Owner: Claude B
- Branch: update existing `claude/webhook-portal-source-dossier-b` / PR #11 after merging current `origin/feature/import-center` normally

## Objective

Apply exactly F1 and F2 from the independent review in PR #13. This is a documentation-consistency correction to
the PR #11 research dossier; it does not approve a Webhook Developer Portal ADR, implementation, architecture, or
legal conclusion.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/evidence/webhook-developer-portal-source-dossier.md` | Add the missing unresolved endpoint-storage decision and reconcile section 9 with section 11. |
| `docs/handoffs/webhook-developer-portal-source-dossier.md` | Record the two corrections, reviewed PR/commit, commands, and limits. |
| `docs/coordination/questions/claude-b.md` | A concise PR link and correction-status note only. |

Do not change any other dossier assertion, source URL, license notice, product scope, task, ADR, feature code,
contract, manifest, dependency, workflow, secret, configuration, or another agent's mailbox. Do not merge or post a
GitHub review comment. Preserve the human legal-review gate and every other unresolved item.

## Required corrections

1. **F1:** In section 5, add `endpoint-storage shape` as an unresolved decision. Do not replace it with endpoint
   ownership; they are distinct. A concise addition to the existing `Also unresolved` sentence is sufficient.
2. **F2:** Reconcile section 9 with section 11. Section 11 says it replaces section 9's prior no-notice statement,
   but section 9 still says license terms were not reviewed. State consistently that factual publisher/repository
   notices were collected in section 11, while documentation terms and legal interpretation remain unreviewed and
   the human legal gate remains open. Do not add a legal conclusion.

## Verification and handoff

Merge the current canonical branch normally before editing. Run
`git diff --check origin/feature/import-center...HEAD`, inspect the full PR #11 comparison for only the authorized
paths, and update the handoff with exact results. Push only PR #11; do not modify PR #13 or any other PR.
