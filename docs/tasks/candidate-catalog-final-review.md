# Candidate catalog final review

- Status: Approved for documentation review
- Owner: Claude A
- Branch: create `claude/candidate-catalog-final-review-a` from the current `origin/feature/import-center` tip after fetching

## Objective

Re-review PR #2 (`claude/feature-catalog-b` into `feature/import-center`) after its F1–F2 corrections. Decide
whether the factual candidate inventory is ready to accept as planning research. This task does not approve a
candidate feature, alter the Import Center work, or create an implementation task.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/handoffs/candidate-catalog-final-review.md` | Review scope, exact source checks, verdict, and any required correction. |
| `docs/coordination/questions/claude-a.md` | A concise PR link and verdict status note only. |

Do not change the catalog, source extract, a candidate-feature branch, code, contracts, manifests, dependencies,
ADRs, GitHub configuration, or another agent's mailbox. Do not merge any PR. Use only
`docs/roadmap/research-v0.2-candidate-source.md`, the original catalog task, the correction task, and PR #2.

## Required review focus

1. Confirm PR #2 is limited to its authorized catalog and handoff paths and that the final comparison contains no
   code, workflow, secret, dependency, or task/ADR decision change.
2. Reconcile all twelve names, research stages, outcomes, dependencies, page references, release order, and
   candidate-only status with the source extract. Specifically confirm the F1–F2 corrections removed unsupported
   explanatory attributions without changing supported facts.
3. Confirm it states that the former 150-feature catalog is superseded, only Import Center has an approved
   implementation task, and job/audit primitives are research dependencies rather than implemented capabilities.
4. Record `ACCEPT` or `REQUEST CHANGES`. Every finding must identify its exact file, impact, and correction.

## Verification and handoff

Run `git diff --check origin/feature/import-center...origin/claude/feature-catalog-b`, inspect the full PR #2
comparison, and record the reviewed commits and commands in the handoff. Open a documentation-only PR targeting
`feature/import-center`, then add its link and verdict to your outgoing-question mailbox. Do not post a GitHub
review comment.
