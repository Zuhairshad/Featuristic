# PR feedback automation design handoff

- Task: [`docs/tasks/pr-feedback-automation-design.md`](../tasks/pr-feedback-automation-design.md)
- Branch: `claude/pr-feedback-automation-design-b`
- Base: `origin/feature/import-center` at `595b7f8e878a6d516ace9a0d1333f72bbd16c7d6`, fetched before branching.
- Final commit: the head of the pull request. A file cannot contain its own hash; read it from `git log -1` or
  the PR.
- Owner: Claude B

## Delivered

| Path | Content |
| --- | --- |
| `docs/adr/0003-pr-feedback-automation.md` | **Proposed** (not Accepted) design: trigger and round limit, same-repository-only rule, two-job least-privilege split, safe checkout and action settings, untrusted-input handling, the single secret, response path, non-goals, an illustrative non-executable sketch, sources, assumptions, open decisions, and the future acceptance checklist. |
| `docs/handoffs/pr-feedback-automation.md` | This file. |

No `.github/` content, secret, credential, dependency, code, manifest, or contract was added. Neither PR #1 nor
PR #2 was changed, and no branch was merged.

## Evidence inspected

- Current state: `git ls-tree -r --name-only origin/feature/import-center` shows no `.github/` path; the
  GitHub check-run listing for PR #1 and PR #2 returned `total_count: 0` on 2026-10-27.
- The PR #1 Codex review (comment `6425693207`), which contains the original workflow proposal that this ADR
  revises. Changes from that proposal: split into two jobs so the key-bearing job has no write token; set the
  read-only profile and `drop-sudo` explicitly; run the action as the last step; keep the prompt static and
  pass review text through `env:`; pin actions to full-length commit SHAs; add the acceptance checklist.
- Official sources, listed with links in the ADR: GitHub's "Events that trigger workflows" and "Secure use
  reference" (read from the `github/docs` repository), and the `openai/codex-action` README and
  `docs/security.md` (read from the `openai/codex-action` repository).

### Source-access limits (be aware before relying on citations)

`docs.github.com` and `developers.openai.com` failed to resolve (`getaddrinfo ENOTFOUND`) from the authoring
environment. The upstream Markdown on `raw.githubusercontent.com` was used instead. Consequences:

- The fork-PR statement (no secrets except `GITHUB_TOKEN`; read-only token) came from a search-result summary of
  the live GitHub page, not from page text. It is marked to-verify in the ADR.
- `developers.openai.com/codex/github-action` was seen only as a search snippet and is labeled as such.
- Quoted wording is a close paraphrase from fetched, summarized text, not a verbatim copy.

## Verification

| Command | Result |
| --- | --- |
| `git diff --cached --check` (before commit) | Exit 0, no whitespace errors. |
| `git diff --cached --name-only` | `docs/adr/0003-pr-feedback-automation.md` and `docs/handoffs/pr-feedback-automation.md` only. |
| `git diff --cached` grepped for key-shaped strings (`sk-`, `ghp_`, `github_pat_`, `AKIA`, private-key headers, JWT-like) | No matches. |
| `git diff --cached --name-only` grepped for `.github/`, `*.yml`/`*.yaml`, lockfiles, `package.json` | No matches. |

The same `git diff --check origin/feature/import-center...HEAD` is re-run after committing; its result is in the
PR description.

Nothing was executed against GitHub Actions: no workflow exists to run, and none was added.

## Coordinator decision follow-up (2026-10-27)

Source: `docs/coordination/responses/claude-b.md`, "coordinator decision: automation-design follow-up". The ADR
stays **Proposed** with its no-config/no-secret boundary. Only the ADR and this handoff were amended (plus the
outgoing mailbox, as the task allows).

| Decision | Where recorded |
| --- | --- |
| Future workflow holds `OPENAI_API_KEY` in the protected environment `codex-pr-review`, with at least one repository-maintainer required reviewer; the review begins after approval. | ADR sections 3 and 6, the sketch, and the acceptance checklist. |
| A future implementation task protects `.github/workflows/codex-pr-review.yml` and its static prompt via CODEOWNERS/path protection, or stops and records the alternative for review (no weaker substitute). | ADR section 6a and the acceptance checklist. |
| `actions/checkout`, `openai/codex-action`, and any posting action are resolved to full commit SHAs only in the future implementation task, from then-current official sources; none is guessed or pinned now. | ADR section 6b and the acceptance checklist. |

The former "open decisions" section is replaced by "Coordinator decisions". The only items left to the
implementation task are the exact static-prompt path and content, and the assumptions listed under Sources.

New assumption recorded: that a job referencing a protected environment is held before its secrets are
released. The GitHub environments page was not read for this amendment.

Git state for this amendment:

- Base canonical at the original design: `595b7f8`. Canonical had since advanced to `ce1362f`, and this branch
  was not merged with it at that point, to stay inside the authorized paths. **Superseded:** the branch was
  later synchronized by a normal merge; see "Base synchronization" below.
- Amendment commit (ADR and handoff content): `547664d1774f265a9056b5bd4bad8c731211280c`.
- PR head: that commit plus one commit that only records this hash and updates the mailbox. A file cannot contain
  its own hash, so read the final PR head from `git log -1` or the PR. The exact final head is also stated in
  the PR comment and mailbox note for this follow-up.

## Base synchronization

Task: [`docs/tasks/pr-feedback-automation-sync.md`](../tasks/pr-feedback-automation-sync.md). Purpose: this branch
predated canonical coordination commits, so GitHub's comparison showed unrelated deletions of files this branch
never touched.

| Item | Value |
| --- | --- |
| Head before synchronization | `c5d55f3580202ffee79ddf961ca53e2c9532d5cc` |
| Original merge base | `595b7f8e878a6d516ace9a0d1333f72bbd16c7d6` |
| Canonical merged | `origin/feature/import-center` at `f1fcf1e1e7752787ecfc2a3980b79e3147ae5f42` |
| Merge commit | `fc47967d42116c2b528b25294b402ee7ed86720f` (a normal two-parent merge; no rebase, no force-push) |
| Conflicts | None. Canonical and branch changed disjoint files. |

The PR head is the merge commit plus one commit that only records these values and the results below. A file
cannot contain its own hash, so read the final head from `git log -1` or the PR.

What the merge brought in, all preserved exactly as canonical has them: `docs/coordination/responses/claude-a.md`,
`docs/coordination/responses/claude-b.md`, `docs/tasks/assignments.md`, and the new
`docs/tasks/candidate-catalog-corrections.md`, `docs/tasks/pr-feedback-automation-review.md`,
`docs/tasks/pr-feedback-automation-sync.md`. ADR 0003 is byte-identical to `c5d55f3`; its design content was not
changed. No workflow, secret, credential, dependency, code, manifest, or contract was added or changed. No
mailbox was modified and no PR comment was posted in this task.

Commands run and observed results (before this recording commit):

| Command | Result |
| --- | --- |
| `git merge --no-ff origin/feature/import-center` | Exit 0, merge commit `fc47967`, no conflicts. |
| `git diff --quiet origin/feature/import-center HEAD -- <each canonical file above>` | All six identical to canonical. |
| `git diff --quiet c5d55f3 HEAD -- docs/adr/0003-pr-feedback-automation.md` | ADR identical to its pre-merge content. |
| `git diff --name-only origin/feature/import-center...HEAD` | `docs/adr/0003-pr-feedback-automation.md`, `docs/coordination/questions/claude-b.md`, `docs/handoffs/pr-feedback-automation.md`. |
| `git diff --name-status origin/feature/import-center HEAD` (two-dot, i.e. the tree difference) | The same three paths only (one modified, two added); no deletions. |
| `git diff --check origin/feature/import-center...HEAD` | Exit 0, no whitespace errors. |

The PR #3 comparison is limited to the automation-design files and Claude B's outgoing status note. PR #3 is held
for Claude A's independent review and is not merged.

## Deferred implementation steps (require a separate approved task)

1. Resolve the open decisions in the ADR (environment secret with reviewers, `.github/workflows/**` ownership,
   prompt ownership, version pins).
2. Write `.github/workflows/<name>.yml` per the ADR, with permissions declared explicitly and actions pinned to
   full-length commit SHAs.
3. A maintainer adds `OPENAI_API_KEY` as an Actions secret.
4. Run the acceptance checklist on a trusted same-repository test PR and record the evidence.
5. Confirm or correct the listed assumptions, update the ADR, and only then review it for Acceptance.

## Remaining gaps

- Live GitHub and OpenAI documentation pages were not directly read; re-check them before implementation.
- Repository settings (whether Actions is enabled, existing secrets, branch protection) were not inspected.
- The design has not been run anywhere. Every integration detail is unverified until the checklist is executed.
