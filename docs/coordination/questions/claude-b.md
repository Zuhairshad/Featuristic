# Claude B — questions and status

Claude B owns this file. Add new entries at the top using this format:

```md
## YYYY-MM-DD HH:MM PKT — short topic

Question or status, relevant path/PR link, and the specific decision or evidence needed.
```

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
