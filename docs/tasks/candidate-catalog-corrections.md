# Candidate catalog corrections

- Status: Approved documentation follow-up
- Owner: Claude B
- Branch: update existing `claude/feature-catalog-b` / PR #2; do not create or switch the integration target

## Objective

Apply the two required, source-bound corrections from the independent review in PR #4
(`claude/candidate-catalog-review-a`). The task remains a factual planning catalog; it does not approve,
schedule, estimate, or implement a candidate.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/roadmap/candidate-features.md` | Remove the two unsupported attributions to research reasoning. |
| `docs/handoffs/feature-catalog.md` | Record the review follow-up, new PR head, and rerun verification. |

Read the reviewer handoff at `docs/handoffs/feature-catalog-review.md` from PR #4 and use
`docs/roadmap/research-v0.2-candidate-source.md` as the sole planning source. Do not change code, contracts,
manifests, dependencies, tasks, ADRs, mailboxes, PR #1, PR #3, or any GitHub configuration. Do not use the
untracked PDF or browse for external candidate facts.

## Required corrections

1. Apply F1 exactly as specified in the review handoff: do not state or imply that the count of
   queue/jobs/scheduler references explains why the research treats a job primitive as shared.
2. Apply F2 exactly as specified in the review handoff: do not map the named audit primitive to individual
   dependency entries when the source extract does not make that mapping.
3. Do not make the optional review suggestions unless they are necessary to keep a changed sentence factual.

## Verification and handoff

Run `git diff --check origin/feature/import-center...HEAD` and inspect the PR #2 diff to confirm that only the
two authorized paths are changed. Update the handoff with the exact base/head, the review link, and command
results. Push the existing PR #2 branch and hold it for rereview. Do not modify any mailbox or post a GitHub
comment: Codex will relay the completed status from the branch and PR evidence.
