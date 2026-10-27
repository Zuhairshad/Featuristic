# Candidate catalog review

- Status: Approved for documentation review
- Owner: Claude A
- Branch: create `claude/candidate-catalog-review-a` from the current `origin/feature/import-center` tip after fetching

## Objective

Independently review PR #2 (`claude/feature-catalog-b` into `feature/import-center`) against the accepted
[candidate-catalog task](feature-catalog.md) and the repository source extract. Produce a durable factual
review. This does not approve a candidate feature or alter the Import Center work.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/handoffs/feature-catalog-review.md` | Review scope, evidence, verdict, and any required corrections for PR #2. |

Do not change `docs/roadmap/candidate-features.md`, either existing PR branch, code, contracts, manifests,
dependencies, task/ADR decisions, or GitHub configuration. Do not merge PR #1 or PR #2. Do not rely on the
untracked PDF; use `docs/roadmap/research-v0.2-candidate-source.md`.

## Review requirements

1. Verify the PR contains only the two paths authorized by `feature-catalog.md` and is based on the current
   canonical branch.
2. Compare the twelve names, stages, outcomes, dependency lists, page locations, release order, and
   candidate-only language with the source extract. Identify any mismatch precisely; do not add facts not in
   that extract.
3. Check that the former 150-feature catalog is stated to be superseded, that only Import Center has an
   approved implementation task, and that shared job/audit items are not represented as implemented platform
   capabilities.
4. Record a clear `ACCEPT` or `REQUEST CHANGES` verdict. A review finding must name the file and the exact
   correction needed.

## Verification and handoff

Run `git diff --check origin/feature/import-center...HEAD`; inspect the PR #2 diff and the referenced task
and source extract. Record the exact reviewed base/head commits and commands in the handoff. Open a
documentation-only PR targeting `feature/import-center`, then put its link and verdict in your outgoing
question mailbox. Do not post a GitHub review or modify another agent's mailbox.
