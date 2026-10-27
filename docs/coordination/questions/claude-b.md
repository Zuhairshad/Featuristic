# Claude B — questions and status

Claude B owns this file. Add new entries at the top using this format:

```md
## YYYY-MM-DD HH:MM PKT — short topic

Question or status, relevant path/PR link, and the specific decision or evidence needed.
```

## 2026-10-27 06:10 PKT — ADR 0003 corrections F1-F3 applied (PR #3)

Status: the three PR #5 findings are corrected in the Proposed ADR on the same PR,
https://github.com/Zuhairshad/Featuristic/pull/3. Canonical `96b7d92` was merged first (normal merge `637463f`,
no conflicts); the correction commit is `bda42d7d1f5dfdef741d1e7f511613db17ec693e`. F1: path protection does not
cover a same-repository `pull_request` run, so the approver must inspect workflow and prompt changes (new
non-production-key test). F2: the gate needs an independent human reviewer with "Prevent self-review", else the
task stops. F3: "cannot approve" is now conditional on the Actions PR-approval setting being disabled.

Evidence limits: GitHub pages were read from the `github/docs` source repository because `docs.github.com` did not
resolve; the exact `pull_request` workflow-file version and "Prevent self-review" behavior for shared accounts
stay labelled assumptions. The ADR is still Proposed. No open question.

## 2026-10-27 05:00 PKT — automation design follow-up done (PR #3)

Status: the coordinator's three decisions are recorded in ADR 0003 and its handoff and pushed to the same PR,
https://github.com/Zuhairshad/Featuristic/pull/3. The ADR is still **Proposed**; no workflow, secret, or other
path was added. The amendment commit is `547664d1774f265a9056b5bd4bad8c731211280c`; the PR head is that commit
plus the commit recording it (see the handoff and PR comment for the exact head). `git diff --check` is exit 0 and
the diff changes only the ADR, handoff, and this mailbox.

One new assumption to verify at implementation: that a job referencing a protected environment is held before the
environment's secrets are released (GitHub environments page not read for this amendment). This branch was not
merged with canonical `ce1362f` (a coordination-only commit) to stay inside the authorized paths. No open question.

## 2026-10-27 04:20 PKT — PR feedback automation design ready for review

Status: docs-only PR opened: https://github.com/Zuhairshad/Featuristic/pull/3 (`claude/pr-feedback-automation-design-b`
from `595b7f8`). ADR 0003 is **Proposed**; no workflow, secret, or automation was added. `git diff --check` exit 0;
two authorized paths only.

Evidence limits you should know: `docs.github.com` and `developers.openai.com` did not resolve from my
environment, so I read upstream Markdown from `github/docs` and `openai/codex-action`. The fork-PR statement is
marked to-verify. Untested assumptions are listed in the ADR.

Decisions needed from the coordinator (also in the ADR): environment secret with required reviewers or a plain
repository secret; ownership of `.github/workflows/**` and the static prompt; which action versions to pin.

Separately, the earlier candidate-catalog PR #2 asked for a link in the Claude A mailbox, which I did not edit
(not my file, outside that task's paths). Please relay it or authorize that edit.
