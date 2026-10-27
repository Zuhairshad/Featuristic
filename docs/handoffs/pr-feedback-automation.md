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

Assumption recorded at that point: that a job referencing a protected environment is held before its secrets are
released. Superseded: the GitHub environments page was read in the later correction task and documents it (see
"Review follow-up" below).

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

## Review follow-up (PR #5 findings F1 to F3)

Task: [`docs/tasks/pr-feedback-automation-corrections.md`](../tasks/pr-feedback-automation-corrections.md). Review:
PR #5, `docs/handoffs/pr-feedback-automation-review.md` on `claude/pr-feedback-automation-review-a` (head
`1bdacea0b5df7966b67bc2dbd496c01a569af198`), verdict REQUEST CHANGES. ADR 0003 remains **Proposed**; no workflow,
secret, credential, dependency, code, or deployment was added.

| Item | Value |
| --- | --- |
| Head before this follow-up | `c27b7efdb67b998cece3e32bfa0c39e767f5e037` (reviewed head) |
| Canonical merged first | `origin/feature/import-center` at `96b7d9209e03a80dd68711ca4a72406becd69deb` |
| Merge commit | `637463f34d90f6d0faccf549793f4270f3acae7b` (normal two-parent merge; no conflicts; no rebase or force-push) |
| Correction commit (ADR and handoff content) | `bda42d7d1f5dfdef741d1e7f511613db17ec693e` |

| Finding | Correction in `docs/adr/0003-pr-feedback-automation.md` |
| --- | --- |
| F1 | Section 6a now says path protection governs the protected branch only and does **not** protect a same-repository `pull_request` run, which uses the PR's own workflow and prompt. Section 6 requires the human approver to read changes to `.github/workflows/**` and the static prompt before releasing the secret. The checklist adds a non-production-key test for a PR that modifies either path. |
| F2 | Section 6 adds "Approver identity": the required reviewer must be a human account that no agent session uses, "Prevent self-review" must be enabled, and if no independent human account exists the implementation task stops and records the alternative (the gate is not called independent). Coordinator decision 1 and the checklist carry the same requirement. |
| F3 | The absolute "cannot approve" claim is replaced by a conditional design claim that depends on the repository setting "Allow GitHub Actions to create and approve pull requests" being disabled. Section 3 states the dependency and labels as an assumption that `pull-requests: write` alone cannot merge. The checklist requires recording the setting. |

The PR head is the correction commit plus one commit that only records its hash and updates the mailbox. A file
cannot contain its own hash, so read the final head from `git log -1` or the PR.

Optional notes O1 and O2 from the review were not applied beyond what the corrections needed: the Sources section
now cites the environment, repository-settings, secure-use and events pages, but the two "to verify" labels that
could not be re-confirmed here (the fork-PR statement and the exact `pull_request` workflow-file version) are kept.

### Sources used and how (be aware before relying on them)

`docs.github.com` and `developers.openai.com` did not resolve from the authoring environment. The upstream
Markdown on `raw.githubusercontent.com` was read through a summarizing fetch tool on 2026-10-27:

- `github/docs`: `manage-environments.md` (required reviewers, up to 6, only one must approve, optional "Prevent
  self-review", protection rules before a job runs or reads environment secrets);
  `managing-github-actions-settings-for-a-repository.md` (the setting "Allow GitHub Actions to create and approve
  pull requests", defaults); `secure-use.md` (CODEOWNERS for workflow files; "A workflow job cannot access
  environment secrets until approval is granted by a reviewer"); `events-that-trigger-workflows.md`
  (`pull_request_target` runs in the base context "rather than in the context of the merge commit, as the
  `pull_request` event does").
- The URL for the environments page was derived from its source path and the published page was not opened.
- Not directly stated by those pages and therefore kept as assumptions: which workflow-file version a
  same-repository `pull_request` run uses (the docs only contrast it with `pull_request_target`); whether
  "Prevent self-review" blocks an agent that approves with the PR author's account; that `pull-requests: write`
  alone cannot merge; and the live repository and organization settings, which were not inspected.

Commands run and observed results (before the recording commit):

| Command | Result |
| --- | --- |
| `git merge --no-ff origin/feature/import-center` | Exit 0, merge commit `637463f`, no conflicts. |
| `git diff --name-only origin/feature/import-center...HEAD` (after the merge) | `docs/adr/0003-pr-feedback-automation.md`, `docs/coordination/questions/claude-b.md`, `docs/handoffs/pr-feedback-automation.md`. |
| `git diff --check` (working tree, after the ADR edits) | Exit 0. |
| Search of the ADR for the removed absolute wording ("cannot approve", "so neither can change without") | No matches; the remaining "cannot merge" hits are inside the labelled assumption. |

No GitHub review comment was posted, per the task, and PR #1, PR #2 and the other branches were not touched.

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
