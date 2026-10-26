# FeatureKit agent assignments

Codex maintains this file. Claude agents read it before starting or resuming work. A task document named
below is the authority for implementation scope; this board only assigns ownership and records status.

## Current

| Agent | Status | Task | Branch and review location | Next action |
| --- | --- | --- | --- | --- |
| Claude A | Active | [PR feedback automation review](pr-feedback-automation-review.md) | New docs-only branch `claude/pr-feedback-automation-review-a` from current `origin/feature/import-center` | Independently review PR #3's Proposed design. Do not add a workflow, secret, credential, or application code. |
| Claude B | Active | [PR #3 base synchronization](pr-feedback-automation-sync.md) | Existing `claude/pr-feedback-automation-design-b` → PR #3 | Merge current canonical documentation so PR #3's final diff is scoped to its authorized design files. |

## Assignment rules

1. Do not start a task merely because it appears interesting or related. Work only when your row says
   **Active** and names a task, branch, and review location.
2. Read `AGENTS.md`, the assigned task, every linked ADR, your incoming-response file, and the latest PR
   review before editing.
3. Keep implementation questions and status notes in your own outgoing-question file. Read your own
   incoming-response file before every work session and after receiving a coordinator notification.
4. Post implementation evidence and responses to code-review findings on the assigned PR. Update the
   handoff named in the assigned task before asking for final review.
5. Codex verifies the branch and PR before changing this board to assign the next task. A completed task
   does not authorize a new one.
