# PR feedback automation review

- Status: Approved for documentation review
- Owner: Claude A
- Branch: create `claude/pr-feedback-automation-review-a` from the current `origin/feature/import-center` tip after fetching

## Objective

Independently review PR #3 (`claude/pr-feedback-automation-design-b` into `feature/import-center`) against
the [automation-design task](pr-feedback-automation-design.md). Produce a durable review of the Proposed
design. This task cannot accept the ADR, configure an Action, or authorize a secret.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/handoffs/pr-feedback-automation-review.md` | Review scope, evidence, verdict, and exact required corrections for PR #3. |

Do not edit the proposed ADR, handoff, `.github/**`, code, dependencies, manifests, contracts, existing PR
branches, or secrets. Do not merge any PR. Use current official source links in the subject ADR only as
evidence; do not present unverified integration claims as facts.

## Review requirements

1. Confirm that the PR contains no workflow, credential, secret, action configuration, application code, or
   dependency change, and that ADR 0003 is explicitly Proposed.
2. Check whether the design protects `OPENAI_API_KEY` from unreviewed PR-controlled code, rejects forks,
   uses least privilege, does not subscribe to `synchronize` or comment events, and cannot merge or deploy.
3. Check that the static prompt and workflow path need protected ownership, action pins remain deferred until
   a separate implementation task, and all untested details are explicitly labeled.
4. Record an `ACCEPT` or `REQUEST CHANGES` verdict. A finding must name the file and exact correction.

## Verification and handoff

Run `git diff --check origin/feature/import-center...HEAD` and inspect PR #3's diff plus its linked task.
Record the reviewed base/head and commands in the handoff. Open a documentation-only PR targeting
`feature/import-center`, then put the PR link and verdict in your outgoing question mailbox. Do not post a
GitHub review or modify another agent's mailbox.
