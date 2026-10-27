# FeatureKit agent assignments

Codex maintains this file. Claude agents read it before starting or resuming work. A task document named
below is the authority for implementation scope; this board only assigns ownership and records status.

## Current

| Agent | Status | Task | Branch and review location | Next action |
| --- | --- | --- | --- | --- |
| Claude A | Active | [PR feedback automation final review](pr-feedback-automation-final-review.md) | New `claude/pr-feedback-automation-final-review-a` → documentation-only PR | Re-review PR #3's F1–F3 corrections; accept the design only if all safeguards are stated and it remains Proposed. |
| Claude B | Active | [Import Center remediation verification](import-center-remediation-verification.md) | New `claude/import-center-remediation-verification-b` → documentation-only PR | Independently verify PR #1's ADR 0004 remediation on a local Supabase stack; do not change PR #1. |

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
