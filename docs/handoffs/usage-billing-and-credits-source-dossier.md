# Usage Billing and Credits source dossier handoff

- Task: [`docs/tasks/usage-billing-and-credits-source-dossier.md`](../tasks/usage-billing-and-credits-source-dossier.md)
- Owner: Claude B
- Branch: `claude/usage-billing-and-credits-source-dossier-b`, created from `origin/feature/import-center` at
  `3c726ac3c8264cc525f1a00771e9037ba51e77c3`
- Final commit: the head of the pull request. A file cannot contain its own hash; read it from `git log -1` or the PR.
- Deliverable: [`docs/evidence/usage-billing-and-credits-source-dossier.md`](../evidence/usage-billing-and-credits-source-dossier.md)

This is **research evidence, not approval**. No currency or unit, ledger schema, provider, provider-event mechanism, job
policy, or architecture was chosen, and no capability, payment, or provider behavior was tested.

## Delivered

| Path | Content |
| --- | --- |
| `docs/evidence/usage-billing-and-credits-source-dossier.md` | The six planning requirements and their status; documented host capabilities (authenticated request boundaries, persistent transactional data, authorization mechanisms, queues and scheduled work, audit and event constraints), each with a source id and a "not stated on the page" column; a requirement-by-requirement map; thirteen unresolved decisions plus further open items; inconsistencies; what was not read; sources; and the source and license note. |
| `docs/handoffs/usage-billing-and-credits-source-dossier.md` | This file. |
| `docs/coordination/questions/claude-b.md` | A concise PR link and status note (added in a later commit, once the PR exists). |

No ADR, implementation task, manifest, code, migration, dependency, workflow, secret, credential, billing provider,
billing account, remote-service configuration, deployment, or other feature's PR was touched. Webhook work was not
touched.

## Method and its limits

- Planning boundary: `docs/roadmap/usage-billing-and-credits-source.md` at the base commit.
- Only first-party documentation for the supported host was used: Next.js, Supabase, and the PostgreSQL project's own
  documentation. No payment provider material was read, no provider account was created, and no payment API was called.
- `nextjs.org`, `supabase.com`, and `www.postgresql.org` did not resolve (`getaddrinfo ENOTFOUND`). Every source row was
  read from the publisher's documentation **source** in its public repository on `raw.githubusercontent.com`
  (`vercel/next.js` `canary`, `supabase/supabase` `master`, `postgres/postgres` `master`). That is the upstream text of
  the published page, but it can differ from the live page and from the versions pinned in the fixture.
- Text was read through a page-summarizing fetch tool; quoted wording is a close paraphrase with short phrases only.
- Search results were used only to locate pages. A search summary that the Supabase JavaScript client has no transaction
  grouping was **not** used as evidence, because the opened Supabase pages do not state it.
- Not established, and recorded as such in the dossier: whether one `rpc()` call runs in a single transaction (the
  database functions page is silent and the JavaScript `rpc` reference entry only points to `postgrest-js`), the
  PostgREST documentation, published-page equivalence, exact commit SHAs (the GitHub API returned HTTP 403), and
  published documentation license terms.

## Verification

| Command | Result |
| --- | --- |
| `git fetch origin` | Canonical tip `3c726ac3c8264cc525f1a00771e9037ba51e77c3`. |
| `git diff --check` on the staged files, before committing | Exit 0, no whitespace errors. |
| `git diff --cached --name-only` searched for `.github/`, `*.yml`/`*.yaml`, lockfiles, `package.json`, and source extensions | No matches. |
| `git diff --cached` searched for key-shaped strings (`sk-`, `ghp_`, `github_pat_`, `AKIA`, private-key headers, JWT-like) | One match: this table's own list of the patterns searched. No key, token, or secret value. |
| `git diff --check origin/feature/import-center...HEAD` after the final commit | Exit 0 (stated in the PR description). |

## Remaining unresolved decisions

Unchanged by this task and listed in the dossier (section 5): currency and unit policy, billing provider, authoritative
usage source, ledger and transaction semantics, concurrency control, idempotency, provider event ingestion,
reconciliation, adjustments and refunds, budgets, jobs and scheduler adapter, tenant and authorization model, and
accounting and audit retention, plus the ledger schema, the hosting target for background work, whether the JavaScript
client can group statements into one transaction, and the operator reconciliation workflow.

## Remaining gaps

- The documentation license terms were not reviewed. Repository notices are recorded in section 9 as evidence only, with
  no legal conclusion, and the human legal-review gate is open.
- The published pages for the pinned versions still need to be read at ADR time.
- The `pg_net` page contradicts itself on supported HTTP methods, and which statement is current is unresolved.
- Every fact comes from documentation. Nothing was run, called, or tested.

## Git state

- Base: `origin/feature/import-center` at `3c726ac3c8264cc525f1a00771e9037ba51e77c3`.
- This branch changes the three paths above only. No GitHub review comment was posted, nothing was merged, and no other
  agent's mailbox was edited.
