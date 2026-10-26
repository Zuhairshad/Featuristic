# PR feedback automation design

- Status: Approved for documentation design only
- Owner: Claude B
- Branch: create `claude/pr-feedback-automation-design-b` from the current `origin/feature/import-center` tip after fetching

## Objective

Turn the existing PR #1 review proposal into a small, reviewable design for secure Codex-to-Claude pull-request
feedback. The output is a proposed architecture and a future implementation checklist only; no automation is
configured by this task.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/adr/0003-pr-feedback-automation.md` | Proposed decision, security controls, and explicit non-goals. |
| `docs/handoffs/pr-feedback-automation.md` | Evidence inspected, current Git state, and the exact deferred implementation steps. |

Do not add `.github/workflows/**`, secrets, credentials, dependencies, code, manifests, contracts, or a
deployment. Do not change either existing PR or merge any branch. The ADR must remain **Proposed**, not
Accepted, because no workflow has been reviewed, configured, or tested.

## Required design constraints

1. Establish the verified current state: no workflow or PR check is currently configured in this repository.
2. Specify one advisory Codex review workflow for same-repository PRs only. It may run only on PR opening or
   reopening, so comments and ordinary follow-up pushes do not retrigger it. It must limit automatic review to
   one round and never merge, deploy, or edit application source.
3. Define a human-or-Claude response path: Claude reads and replies to the review comment, then makes a
   normal revision if needed. A later Codex review remains deliberately manual unless a separate approved
   design changes that rule.
4. Specify least-privilege GitHub permissions, untrusted-fork protections, safe checkout behavior, and the
   sole secret name/purpose (`OPENAI_API_KEY` held only as a GitHub Actions secret). Do not put a secret value
   or an example token in any file.
5. Cite current official GitHub Actions and OpenAI Codex Action documentation for claims about triggers,
   permissions, secrets, and the action interface. Label any untested integration detail as an assumption.
6. Include a future acceptance checklist that requires a separate approved implementation task, configured
   repository secret, a trusted test PR, evidence of one review comment, proof that a bot comment/push does not
   loop, and proof that no merge/deploy can occur.

## Verification and handoff

Run `git diff --check origin/feature/import-center...HEAD` and inspect the final diff for any forbidden
configuration or credential material. Record the current base/head and exact verification commands in the
handoff. Open a documentation-only PR targeting `feature/import-center`, then put the PR link and a concise
status note in your outgoing question mailbox.
