# PR feedback automation final review

- Task: [`docs/tasks/pr-feedback-automation-final-review.md`](../tasks/pr-feedback-automation-final-review.md)
- Reviewer: Claude A
- Subject: PR #3, `claude/pr-feedback-automation-design-b` into `feature/import-center`
- Reviewed PR #3 head: `ef82c75c604d7a7b406724deda307eaa6e0f6b88`
- PR #3 merge base with canonical: `96b7d9209e03a80dd68711ca4a72406becd69deb`
- Canonical tip when this review branch was created: `30321d2a9de7916d51702ba912a73f317060c57e`
- Review branch: `claude/pr-feedback-automation-final-review-a`, created from that canonical tip
- Method: read the three-dot PR diff, ADR 0003 and the PR #3 handoff in full, the correction task, and the cited
  official sources. No file of PR #3, PR #1 or any other branch was changed. No GitHub review was posted.

## Verdict: ACCEPT (as a Proposed design document)

The corrected ADR states every safeguard the task lists, introduces nothing executable, and stays **Proposed**.
"Accept" here means the design text is ready for the coordinator to accept as a design; it does not authorize a
workflow, secret, environment or setting. Three optional, non-blocking notes follow. None is a required correction.

## Required review focus: results

### 1. Documentation only, still Proposed

| Check | Result |
| --- | --- |
| `git diff --check origin/feature/import-center...origin/claude/pr-feedback-automation-design-b` | Exit 0. |
| `git diff --name-status` (three-dot) | `docs/adr/0003-pr-feedback-automation.md` (A), `docs/handoffs/pr-feedback-automation.md` (A), `docs/coordination/questions/claude-b.md` (M). Nothing else. |
| `git ls-tree -r --name-only` on the PR head, count of `.github/` paths | `0`: no workflow, action configuration or CODEOWNERS file. |
| Added lines searched for key-shaped strings (`sk-`, `ghp_`, `github_pat_`, `AKIA`, private-key headers) | One hit, in the handoff, which *describes* that same search. No credential. |
| ADR status line | "Status: **Proposed.** Not accepted. No workflow, secret, or automation is configured, reviewed, or tested." |
| ADR sketch | Inside a Markdown fence, explicitly "not installed, not a workflow file", action versions are placeholders. |

Note: a two-dot diff against the current canonical tip also lists coordination files, because canonical advanced
past PR #3's merge base. That is the normal PR comparison, not content of PR #3. GitHub's PR view uses the
three-dot form above.

### 2. Corrected safeguards (F1 to F3 from PR #5)

| Requirement | Where the ADR states it | Result |
| --- | --- | --- |
| Protected environment and human approval before the key is released | Section 6 "Protected environment"; section 3 table; sketch `environment: codex-pr-review`; checklist item on a held run | Present. |
| Same-repository PR-controlled workflow or prompt changes need human inspection | Section 6 "What the approver must do (correction F1)"; section 6a states path protection does not cover a same-repository `pull_request` run; checklist item with a non-production key | Present. |
| Independent human reviewer plus "Prevent self-review" | Section 6 "Approver identity (correction F2)"; coordinator decision 1; checklist item; stop-and-record rule when no independent account exists | Present. The ADR avoids claiming independence it cannot show. |
| Action approval capability treated as a setting to verify later | Intro, section 3, Sources assumptions, checklist item recording "Allow GitHub Actions to create and approve pull requests" as disabled, including any inherited organization value | Present, conditional, and no longer an absolute "cannot approve" claim (searched: no such wording remains). |

### 3. Remaining design properties

| Property | Evidence in the ADR | Result |
| --- | --- | --- |
| Full-SHA pins deferred to the implementation task | Section 6b, sketch placeholders, checklist | Present. |
| Workflow and static prompt protected, or a documented stop | Section 6a ("must stop and record the alternative", no weaker substitute) | Present. |
| Fork execution rejected | Section 2 job condition; no `pull_request_target`; fork PR checklist item | Present. |
| Limited permissions | Section 3: `permissions: {}` default, `contents: read` for the key-bearing job, write only in the keyless job | Present. |
| No bot-to-bot loop | Section 1: no comment event, `GITHUB_TOKEN` events do not start runs, only a comment is created | Present. |
| Capped automatic rounds | `types: [opened, reopened]` only; a reopen needs a new approval and is described as manual | Present. |
| Never merges or deploys | Non-goals; no `contents: write`; the "write-only comment cannot merge" point is labelled an assumption | Present. |

### 4. External claims checked against the cited sources

I could reach `docs.github.com`, `raw.githubusercontent.com` and the `openai/codex-action` repository from this
environment (PR #3's author could not reach the first). Results:

| Claim | Source read | Result |
| --- | --- | --- |
| A job referencing an environment follows its protection rules "before running or accessing the environment's secrets"; up to 6 reviewers, only one must approve; optional "Prevent self-review" described as preventing users approving runs they triggered | `github/docs` `manage-environments.md`, read directly | Confirmed. |
| `pull_request` default types are `opened`, `synchronize`, `reopened`; `types` overrides; `GITHUB_SHA` is the last merge commit of the PR merge branch | Live "Events that trigger workflows" page | Confirmed. |
| Fork PRs: secrets other than `GITHUB_TOKEN` are not passed; `GITHUB_TOKEN` is read-only | Same live page | **Confirmed.** The ADR still labels this "to verify on the live page"; that label can now be removed. |
| The setting "Allow GitHub Actions to create and approve pull requests" controls whether `GITHUB_TOKEN` can create and approve PRs | Live "Managing GitHub Actions settings for a repository" page | The setting and its effect are confirmed. The *default values* the ADR quotes (off for personal repositories, inherited for organizations) are not in the section I read; they remain unverified and must be read from the repository's actual settings in the implementation task, as the checklist already requires. |
| `openai/codex-action`: write access required by default; `drop-sudo` default and recommended; passwordless `sudo` plus read-only filesystem can expose the key; run as the last step; `AGENTS.md` in PR content is untrusted | `docs/security.md` and README | Confirmed. |
| `permission-profile: ":read-only"` exists and works with `safety-strategy: drop-sudo`; `safety-strategy: read-only` cannot be combined with a profile | README "Permission profiles" | Confirmed from the README. The ADR keeps it as an assumption to confirm on a test PR, which is right because nothing was run. |

Anything involving real runtime behavior (which workflow-file version a same-repository `pull_request` run uses,
whether "Prevent self-review" blocks an agent using the PR author's account, whether `pull-requests: write` alone
can merge, comment size limit) cannot be tested without a workflow and a secret, and I did not test it. The ADR
labels each as an assumption, which is the correct handling.

## Optional notes (not required for acceptance)

- **N1 (scope of the approver's inspection).** Sections 6 and the checklist name `.github/workflows/**` and the
  static prompt path. A same-repository PR can also change other files that the run executes or reads, for example
  a local composite action under `.github/actions/**`. Consider widening the instruction to "all of `.github/**`
  and the prompt path" in the implementation task. This tightens, and does not contradict, the current text.
- **N2 (profile maturity).** The README says permission profiles are beta and need Codex CLI `0.138.0` or later.
  The ADR does not mention either. The implementation task should check the pinned `codex-version` against that.
- **N3 (source labels).** Once the implementation task rereads the sources, the fork-PR "to verify" label and the
  "(as summarized by search)" phrase can be replaced with the confirmed wording above.

## What I ran

| Command or action | Result |
| --- | --- |
| `git fetch origin` | Canonical `30321d2`; PR #3 head `ef82c75`. |
| `git diff --check origin/feature/import-center...origin/claude/pr-feedback-automation-design-b` | Exit 0. |
| `git diff --name-status` same range | Three docs paths only. |
| `git ls-tree -r --name-only origin/claude/pr-feedback-automation-design-b \| grep -c '^\.github'` | `0`. |
| Key-shape search over the added lines | No credential. |
| Read ADR 0003, the PR #3 handoff, `pr-feedback-automation-corrections.md` and the earlier PR #5 review | Findings above. |
| Fetched GitHub docs (environments, events, repository settings) and `openai/codex-action` README and security notes | Results in the source table. |

## Not verified

- No GitHub Actions workflow, environment, secret, CODEOWNERS file or repository setting exists or was inspected;
  the live repository and organization settings were not read.
- Nothing about runtime behavior was executed. This is a review of a design document only.
- The default values of "Allow GitHub Actions to create and approve pull requests" were not confirmed.

## Git state

- Base: `origin/feature/import-center` at `30321d2a9de7916d51702ba912a73f317060c57e`.
- This branch adds this file and a status entry in `docs/coordination/questions/claude-a.md`. Read the final head
  from `git log -1` or the PR; a file cannot contain its own hash.
- PR #3, PR #1, ADR 0003 and every other mailbox were not changed. Nothing was merged.
