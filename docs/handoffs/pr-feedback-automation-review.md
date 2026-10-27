# PR feedback automation review handoff

- Task: [`docs/tasks/pr-feedback-automation-review.md`](../tasks/pr-feedback-automation-review.md)
- Reviewer: Claude A
- Subject: PR #3, `claude/pr-feedback-automation-design-b` into `feature/import-center`, author Claude B. It
  proposes ADR 0003 (advisory Codex review workflow).
- Review branch: `claude/pr-feedback-automation-review-a`, created from `origin/feature/import-center` at `93be434`

This review does not accept ADR 0003, configure an Action, or authorize a secret. The ADR stays Proposed.

## Verdict: REQUEST CHANGES

The design is sound in structure: same-repository only, `opened`/`reopened` only, two jobs with the key held
only by the read-only one, a static prompt, an environment approval gate, and deferred pins. It contains no
workflow, secret or code. Three statements about the key's protection are, however, overstated or unsupported,
and they are the claims the whole design rests on. Each is a small edit to one file, with exact text below.
Two optional notes are non-blocking.

## Reviewed state

| Item | Value |
| --- | --- |
| PR #3 head (reviewed) | `c27b7efdb67b998cece3e32bfa0c39e767f5e037` ("docs(handoff): record PR #3 base synchronization") |
| PR #3 base | `f1fcf1e1e7752787ecfc2a3980b79e3147ae5f42` (the branch was synchronized with canonical by a normal merge, `fc47967`) |
| Canonical tip at review | `93be4345430860039bd67df9756406b0644e0e7a` |
| PR #3 relative to the tip | one commit behind (`93be434`: assignment board, mailbox response, one task document). It changes none of PR #3's three files. |
| Files PR #3 changes | `docs/adr/0003-pr-feedback-automation.md`, `docs/handoffs/pr-feedback-automation.md`, `docs/coordination/questions/claude-b.md` |
| Reference documents | `docs/tasks/pr-feedback-automation-design.md` and this review's task, read at the canonical tip |

## Requirement 1: nothing forbidden, and the ADR is Proposed

| Check | Result |
| --- | --- |
| No workflow, credential, secret, action configuration, application code or dependency change | **Pass.** `git diff --name-only origin/feature/import-center...origin/claude/pr-feedback-automation-design-b` lists the three files above. None is under `.github/`, none is `.yml`/`.yaml`, a lockfile, `package.json`, or a source file (count of such paths: 0). |
| The third file is allowed | **Pass.** `docs/coordination/questions/claude-b.md` is Claude B's own outgoing mailbox; the design task directs the PR link and a status note there. |
| Key-shaped strings in added lines | **None.** One regex hit is the handoff's own prose naming the patterns it searched for (`sk-`, `ghp_`, …), not a key. |
| ADR 0003 is explicitly Proposed | **Pass.** ADR line 3: "Status: **Proposed.** Not accepted. No workflow, secret, or automation is configured, reviewed, or tested." (A naive search for the word "accepted" also matches inside "Not accepted"; the status is Proposed.) |
| Whitespace | **Pass.** `git diff --check origin/feature/import-center...origin/claude/pr-feedback-automation-design-b` exits 0. |

## Requirement 2: security properties

| Property | Result |
| --- | --- |
| Protects `OPENAI_API_KEY` from unreviewed PR-controlled code | **Partly.** The only barrier is the environment approval (sections 3 and 6). The environment gate itself is documented behavior (see Evidence). Two statements about it are incomplete: see F1 and F2. |
| Rejects forks | **Pass.** Job condition `github.event.pull_request.head.repo.full_name == github.repository`. GitHub's pages state that secrets other than `GITHUB_TOKEN` are not passed to forked-repository runs and that the token is read-only there, so the ADR's "to verify" fork statement is correct. |
| Least privilege | **Pass.** `permissions: {}` at workflow level; `contents: read` for the key-bearing job; `pull-requests: write` for the posting job, which has no key. |
| No `synchronize` or comment events | **Pass.** The sketch's only trigger is `pull_request` with `types: [opened, reopened]`; it mentions no `synchronize`, `issue_comment` or review event. GitHub's default types when `types` is omitted are `opened`, `synchronize`, `reopened`, so listing two is what removes `synchronize`. |
| Cannot merge or deploy | **Consistent with the ADR.** No `contents: write` or deployment permission is granted. The merge-endpoint permission requirement was not independently checked. "Cannot approve" is a separate claim: see F3. |

## Requirement 3: protected ownership, pins and labelled assumptions

| Check | Result |
| --- | --- |
| Static prompt and workflow path need protected ownership | Present (section 6a) but overstated: see F1. |
| Action pins deferred to a separate implementation task | **Pass.** Section 6b, placeholders in the sketch, and a checklist item. No version or SHA is chosen. |
| Untested details explicitly labelled | **Pass.** Sources lists untested details and the checklist's last item requires resolving them. Several are now resolvable from official pages (O1). |

## Findings

### F1 (required): path protection is described as protecting the secret, but it does not cover the run that holds it

- File: `docs/adr/0003-pr-feedback-automation.md`, section 6a (lines 128–132) and section 6 (lines 114–124);
  checklist lines 244–246.
- Current text, line 128–129: "A future implementation task must add repository protection for **both** … the
  workflow's static prompt file, so neither can change without review."
- Problem: path protection (CODEOWNERS) governs changes proposed to the protected branch. GitHub's wording:
  "any proposed changes to these files will first require approval from a designated reviewer". It does not
  stop a same-repository PR from running its own modified workflow. The ADR already says so in section 6
  (lines 117–119: a PR author "can change the workflow file in their own PR"). For a `pull_request` run the
  workflow comes from the PR's merge commit (GitHub contrasts `pull_request_target`, which runs in the base
  branch's context "rather than in the context of the merge commit, as the `pull_request` event does"), and the
  sketch's `prompt-file` is read from that same checkout. So for such a run both files are PR-controlled, and
  the only barrier is the environment approval. The ADR never says what the approver must look at, and the
  checklist has no test for this case.
- Exact corrections:
  1. Replace "so neither can change without review." (line 129) with "so neither can change on the protected
     branch without review. This does not protect a `pull_request` run for a same-repository PR: that run
     uses the workflow and prompt from the PR's own merge commit, so the environment approval in section 6 is
     the only control for that case."
  2. After line 122's sentence ending "Reopening a PR starts another run that needs its own approval." add:
     "The approver must read the PR's changes to `.github/workflows/**` and to the static prompt path before
     approving, and must not approve a run whose PR changes either without that review."
  3. Add after line 246: "- [ ] A same-repository test PR that modifies the workflow or the prompt does not
     start the key-bearing job until a maintainer approves, and the approval record shows the approver reviewed
     that change (use a non-production test key)."

### F2 (required): the approval gate assumes a reviewer identity the repository may not have

- File: `docs/adr/0003-pr-feedback-automation.md`, lines 114–116 and checklist lines 241–244.
- Problem: the ADR requires "at least one repository-maintainer required reviewer" but does not say who that is
  or address self-approval. GitHub documents an optional environment setting, "Prevent self-review", "to prevent
  users from approving workflows runs that they triggered". In this repository the evidence points to one shared
  identity: PRs #1, #2, #3 and #4 are all reported by the API as authored by the same login, `Zuhairshad`, so
  agent sessions and the owner appear to act through one account. If that account is the only reviewer, then
  either self-review prevention cannot be turned on, or an agent session using that account's credentials may be
  able to approve its own PR's run. Whether it can was not tested. The gate that the whole design relies on is
  then not demonstrably independent.
- Exact corrections:
  1. Add after line 124: "**Approver identity.** The required reviewer must be a human account that no agent
     session uses, and 'Prevent self-review' must be enabled. If no such account exists, this gate is not
     independent: the implementation task must stop and record the alternative for review, as in section 6a."
  2. Add to the checklist after line 244: "- [ ] The environment's required reviewer and its 'Prevent
     self-review' setting are recorded, with evidence that no agent session's credentials can approve the
     pending deployment."

### F3 (required): "cannot approve" is stated as fact, but depends on a repository setting the ADR never mentions

- File: `docs/adr/0003-pr-feedback-automation.md`, lines 25–26 (Decision) and checklist lines 254–255.
- Current text: "It cannot merge, deploy, approve, push, or edit application source."
- Problem: the posting job holds `pull-requests: write`. GitHub documents a repository setting, "Allow GitHub
  Actions to create and approve pull requests", which controls "whether `GITHUB_TOKEN` can create and approve
  pull requests". The default for a new personal-account repository is that workflows cannot; organization
  repositories inherit the organization's setting. The ADR says repository settings were not inspected (line 19),
  so "cannot approve" is currently unsupported. The checklist checks that no step approves, not that the token
  could not.
- Exact corrections:
  1. Replace lines 25–26's second sentence with "It is designed not to merge, deploy, push, or edit application
     source, and not to approve pull requests provided the repository setting 'Allow GitHub Actions to create
     and approve pull requests' is disabled (not yet inspected)."
  2. Add to the checklist after line 255: "- [ ] The repository setting 'Allow GitHub Actions to create and
     approve pull requests' is recorded as disabled."

### O1 (optional, non-blocking): some "to verify" labels can now be resolved

- File: `docs/adr/0003-pr-feedback-automation.md`, lines 45 and 122–124, and the Sources section (lines ~203–216).
- Observation: the ADR author could not reach `docs.github.com` or `developers.openai.com`. From this review's
  environment the pages were reachable (see Evidence). The fork-PR statement and the environment-gate assumption
  are both stated on those pages. After a maintainer re-checks the live pages, the ADR can cite them and drop
  those two "to verify" labels. Keep the remaining assumptions labelled.

### O2 (optional, non-blocking): the base is described inconsistently

- Files: the PR #3 description and `docs/handoffs/pr-feedback-automation.md` line 5.
- Observation: both name the base as `595b7f8`. After the later synchronization the PR's base is `f1fcf1e`. The
  handoff's own "Base synchronization" section explains this, so only the header line and PR description lag.
  Suggested correction: state both ("branched from `595b7f8`, synchronized to `f1fcf1e`").

## Evidence from official sources

Fetched in this review with a page-summarizing fetch tool (the quoted wording is the tool's extract, not a
verbatim page copy). Re-check the live pages before implementation.

| Claim | Source | Result |
| --- | --- | --- |
| A job cannot access environment secrets until a required reviewer approves | GitHub, "Secure use reference"; "Managing environments for deployment" | Stated: "A workflow job cannot access environment secrets until approval is granted by a reviewer." |
| "Prevent self-review" exists and is optional | "Managing environments for deployment" | Stated. |
| CODEOWNERS can require review of workflow-file changes | "Secure use reference" | Stated, for proposed changes. |
| Default `pull_request` types; `GITHUB_SHA`/`GITHUB_REF` | "Events that trigger workflows" | Match the ADR. |
| Fork runs get no secrets except `GITHUB_TOKEN`; the token is read-only | "Events that trigger workflows"; "Using secrets in GitHub Actions" | Stated. |
| `GITHUB_TOKEN`-created events do not start runs, except `workflow_dispatch`/`repository_dispatch`; `pull_request` runs created that way need approval | "Events that trigger workflows" | Matches the ADR. |
| A setting controls whether `GITHUB_TOKEN` can create and approve PRs | "Managing GitHub Actions settings for a repository" | Stated; default off for new personal repositories. |
| `safety-strategy` default `drop-sudo`; values `drop-sudo`, `unprivileged-user`, `read-only`, `unsafe`; `read-only` cannot combine with a permission profile; `drop-sudo` can | `openai/codex-action` README | Match the ADR. |
| `final-message` output, `prompt-file` input, write-access default for who may trigger | README and `docs/security.md` | Match the ADR. |
| Run the action as the last step; prompt injection via PR bodies, commit messages and `AGENTS.md`; read-only plus `sudo` can expose the key | `docs/security.md` | Match the ADR. |

Not confirmed by this review: that `:read-only` is a built-in permission profile name (the README extract named
`:workspace`); the meaning of `allow-users: "*"` (the README says `*` is unsupported for `allow-bot-users`); which
permission the REST merge endpoint requires; runner behavior of `drop-sudo`; and the comment size limit. The ADR
already labels the profile name and the size limit as assumptions.

## Commands run

| Command | Result |
| --- | --- |
| `git fetch origin` | Canonical tip `93be434`. |
| `git diff --name-only origin/feature/import-center...origin/claude/pr-feedback-automation-design-b` | The three files listed above. |
| Path scan of that list for `.github/`, `.yml`/`.yaml`, lockfiles, `package.json`, source extensions | 0 matches. |
| Key-shape scan of the added lines | No keys; one prose hit in the handoff. |
| `git diff --check origin/feature/import-center...origin/claude/pr-feedback-automation-design-b` | Exit 0. |
| `git diff --name-only <PR #3 base> origin/feature/import-center` | Three documentation files, none of them PR #3's. |
| Page fetches of the GitHub and `openai/codex-action` documents listed above | Results in the Evidence table. |
| `git diff --check origin/feature/import-center...HEAD` (this branch) | Exit 0 (run before commit and again after). |

## Limits

- ADR 0003 was reviewed as a document. Nothing was run on GitHub Actions: no workflow exists to run.
- Official-page results come from a summarizing fetch tool and one environment's view of the live pages.
- Repository settings (Actions enablement, existing secrets, environments, reviewer accounts, the PR-approval
  setting) were not inspected, as in the ADR itself.
- No GitHub review or comment was posted on PR #3, per the task. PR #1, PR #2, PR #3, their branches, code,
  dependencies, `.github/**` and secrets were not touched.
