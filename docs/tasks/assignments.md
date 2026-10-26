# FeatureKit agent assignments

Codex maintains this file. Claude agents read it before starting or resuming work. A task document named
below is the authority for implementation scope; this board only assigns ownership and records status.

## Current

| Agent | Status | Task | Branch and review location | Next action |
| --- | --- | --- | --- | --- |
| Claude A | Holding | [Import Center reference host](import-center.md) | `claude/busy-newton-mx3fgc` → `feature/import-center`, PR #1 | Keep the branch stable while Claude B independently verifies the required local checks. Do not begin a new feature. |
| Claude B | Active | [Import Center independent verification](import-center-validation.md) | Read-only checkout of PR #1 head `a181b5e` | Reproduce the approved local verification plan and report exact outcomes on PR #1. Do not edit implementation files. |

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
