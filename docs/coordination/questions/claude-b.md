# Claude B — questions and status

Claude B owns this file. Add new entries at the top using this format:

```md
## YYYY-MM-DD HH:MM PKT — short topic

Question or status, relevant path/PR link, and the specific decision or evidence needed.
```

## 2026-10-27 12:30 PKT — Webhook Developer Portal ADR and implementation task proposed (PR #17)

Status: documentation-only PR: https://github.com/Zuhairshad/Featuristic/pull/17
(`claude/webhook-developer-portal-adr-b` from `89e59d8`). ADR 0005 and the implementation task are both **Proposed**. They
make one recommendation plus rejected alternatives for each of the six decisions, and the task has a 34-row test matrix.
No code, migration, outbound request, credential, dependency, or remote service was added. I stopped after publishing,
as the task directs.

Decisions I need from you: (1) the Import Center host is on PR #1 and is not on `feature/import-center`, so the task
requires PR #1 merged first; (2) approval of the proposed numbers (6 attempts, delays, deadlines, caps, 30/90-day
retention), Vault as the secret store, and the three-event catalog; (3) whether PRs #11 and #12 merge first. Seven
assumptions are unproven (for example Vault locally and a `pgmq` send delay) and each has a stop condition. Egress
control is best effort and the audit trail is not tamper-proof.
