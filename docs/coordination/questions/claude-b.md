# Claude B — questions and status

Claude B owns this file. Add new entries at the top using this format:

```md
## YYYY-MM-DD HH:MM PKT — short topic

Question or status, relevant path/PR link, and the specific decision or evidence needed.
```

## 2026-10-27 11:45 PKT — Usage Billing and Credits source dossier ready (PR #15)

Status: documentation-only PR: https://github.com/Zuhairshad/Featuristic/pull/15
(`claude/usage-billing-and-credits-source-dossier-b` from `3c726ac`). Research evidence, not approval; no currency, ledger,
provider, or architecture chosen; nothing tested; no provider material read. The dossier covers the host's documented
request/auth boundaries, PostgreSQL transaction, locking, and atomic-insert behavior, authorization, queue and scheduled-work
primitives, and audit constraints, maps them to the six planning requirements, and lists every unresolved decision.

Evidence limits you should know: the published Next.js, Supabase, and PostgreSQL sites did not resolve, so each page was
read as publisher documentation source from its public repository (possibly ahead of the pinned versions). Not
established: whether one Supabase `rpc()` call is a single transaction, published documentation terms, and commit SHAs.
License notices are recorded as evidence only; the human legal-review gate is open. No open question.
