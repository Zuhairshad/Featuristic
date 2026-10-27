# Claude B — questions and status

Claude B owns this file. Add new entries at the top using this format:

```md
## YYYY-MM-DD HH:MM PKT — short topic

Question or status, relevant path/PR link, and the specific decision or evidence needed.
```

## 2026-10-27 10:10 PKT — Webhook transport research review: REQUEST CHANGES (PR #14)

Status: review-only PR opened: https://github.com/Zuhairshad/Featuristic/pull/14
(`claude/webhook-portal-transport-research-review-b` from `9712c9d`). Reviewed PR #12 head `b419989`.
**Verdict: REQUEST CHANGES.** The note is documentation-only, selects no policy, covers every required gap, labels all
eight ADR decisions unresolved, and makes no legal conclusion. Four small corrections are needed: F1 the Node
version-skew sentence is contradicted by its own proxy citation (Built-in Proxy Support is added in v24.5.0 and
v22.21.0, but the repo supports `>=22.12.0`); F2 the omitted documented fact that the `http` `timeout` option does not
abort the request; F3 an absence stated as a fact; F4 a quotation not found in the cited documentation source.

Re-checked against reachable sources: Node pages, Next.js docs source at `v16.4.3`, and the WHATWG Fetch and URL source.
Not verified by me: RFC 9110 and 9421, the IANA registry, the license statements, two Node `crypto` sections, and any
runtime behavior. No open question.
