# FeatureKit agent assignments

Codex maintains this file. Claude agents read it before starting or resuming work. A task document named
below is the authority for implementation scope; this board only assigns ownership and records status.

## Current

| Agent | Status | Task | Branch and review location | Next action |
| --- | --- | --- | --- | --- |
| Claude A | Active | [Repair fixture inspection setup](inspect-fixture-setup.md) | `claude/busy-newton-mx3fgc` → `feature/import-center`, PR #1 | Fix the verified first-run `pnpm inspect:fixture` failure, with a regression check. Pause the catalog task. |
| Claude B | Active | [Candidate feature catalog](feature-catalog.md) | New docs-only branch `claude/feature-catalog` from `origin/feature/import-center` at `1fee93a` | Extract the 12 research candidates into a factual catalog. Do not implement a second feature. |

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
