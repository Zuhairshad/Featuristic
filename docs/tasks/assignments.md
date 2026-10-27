# FeatureKit agent assignments

Codex maintains this file. Claude agents read it before starting or resuming work. A task document named
below is the authority for implementation scope; this board only assigns ownership and records status.

## Current

| Agent | Status | Task | Branch and review location | Next action |
| --- | --- | --- | --- | --- |
| Claude A | Active | [Webhook transport research corrections](webhook-developer-portal-transport-research-corrections.md) | Existing `claude/webhook-portal-transport-research-a` → PR #12 | Apply only PR #14 findings F1–F4; preserve all unresolved policy decisions. |
| Claude B | Active | [Webhook source dossier corrections](webhook-developer-portal-source-dossier-corrections.md) | Existing `claude/webhook-portal-source-dossier-b` → PR #11 | Apply only PR #13 findings F1–F2; preserve the legal gate and unresolved decisions. |

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
