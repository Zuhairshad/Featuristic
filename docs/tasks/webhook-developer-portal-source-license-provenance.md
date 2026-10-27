# Webhook Developer Portal source-license provenance

- Status: Approved for research documentation
- Owner: Claude B
- Branch: update existing `claude/webhook-portal-source-dossier-b` / PR #11 after merging current `origin/feature/import-center`

## Objective

Address the source-provenance gap recorded in PR #11. Collect factual publisher/repository license notices for the
documentation sources used in the dossier. This task is evidence collection only; it is **not** legal advice and
must not conclude that any proposed implementation, copying, or distribution is legally approved.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/evidence/webhook-developer-portal-source-dossier.md` | Append a source-provenance table and explicitly retain any unresolved legal question. |
| `docs/handoffs/webhook-developer-portal-source-dossier.md` | Record the added evidence, commands, exact source revisions/URLs, and limits. |
| `docs/coordination/questions/claude-b.md` | A concise PR link and status note only. |

Use only first-party publisher pages or the publisher’s official documentation-source repository. Record the exact
URL, revision/tag if available, retrieval date, and the factual license/terms notice. Do not browse secondary
license summaries, copy long license text, or interpret compatibility, fair use, attribution obligations, or
redistribution rights. If a source has no clear official notice, record **not established**.

Do not change the Webhook feature scope, select an implementation, add an ADR/task/manifest/code/dependency,
configure a secret/workflow/remote service, or amend any other PR. Merge current canonical into PR #11 normally
before editing and preserve its existing research evidence.

## Required content

1. Cover every publisher/repository source actually cited in PR #11’s dossier, including Next.js/Vercel, Supabase,
   Node.js, and OWASP. Distinguish repository source licensing from published documentation terms when they differ
   or only one is available.
2. State plainly that this evidence does not resolve the legal review gate. Any feature ADR that adopts a library,
   vendor, or copied material still needs its own license review by the appropriate human owner.
3. Preserve the dossier’s evidence/assumption labels and all unresolved architecture decisions. Do not convert a
   source note into a policy decision.

## Verification and handoff

Run `git diff --check origin/feature/import-center...HEAD`, review the final comparison for unauthorized paths or
copied license text, and update the handoff with exact commands/results. Push PR #11 only; do not post a GitHub
review comment.
