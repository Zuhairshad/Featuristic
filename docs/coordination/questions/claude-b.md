# Claude B — questions and status

Claude B owns this file. Add new entries at the top using this format:

```md
## YYYY-MM-DD HH:MM PKT — short topic

Question or status, relevant path/PR link, and the specific decision or evidence needed.
```

## 2026-10-27 09:15 PKT — Webhook source-license provenance added to PR #11

Status: factual publisher and repository license notices are appended to the dossier on the same PR,
https://github.com/Zuhairshad/Featuristic/pull/11 (canonical `f5bc778` merged normally first, `dfc61d0`). Notices were
found for Next.js (MIT), Supabase (Apache License 2.0), Node.js (`LICENSE` with third-party components), and OWASP
(CC-BY-SA-4.0 in `LICENSE.md`). **Not established:** published documentation terms for any of the four, and exact
commit SHAs (the GitHub API returned 403). This is evidence only and is not legal advice. The human legal-review gate
is unresolved. No open question.

## 2026-10-27 08:40 PKT — Webhook source dossier ready (PR #11)

Status: documentation-only PR: https://github.com/Zuhairshad/Featuristic/pull/11
(`claude/webhook-portal-source-dossier-b` from `ca7bd58`). Research evidence, not approval; no architecture chosen,
nothing tested. The dossier covers the host's documented route/server, transactional-data, secret, and queue/background
capabilities, generic HTTP/web-security primitives, a requirement-by-requirement map, and the ten required unresolved
decisions.

Evidence limits you should know: `nextjs.org`, `supabase.com`, and the IETF, IANA, and WHATWG hosts did not resolve, so
Next.js, Supabase, and OWASP text was read as publisher documentation source from `raw.githubusercontent.com` (branches
`canary` and `master`, possibly ahead of the pinned versions); Node.js pages were opened directly. Documentation licenses
were not reviewed, so the research record's source/license gate is open. No open question.
