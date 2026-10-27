# Usage Billing and Credits source dossier

> Status: **research evidence, not approval.** This dossier does not authorize a Usage Billing and Credits ADR,
> implementation task, migration, dependency, payment provider, credential, billing account, or remote-service
> configuration. It chooses no currency or unit, ledger schema, provider, provider-event mechanism, job policy, or
> architecture, and nothing in it was tested.

- Task: [`docs/tasks/usage-billing-and-credits-source-dossier.md`](../tasks/usage-billing-and-credits-source-dossier.md)
- Planning boundary: [`docs/roadmap/usage-billing-and-credits-source.md`](../roadmap/usage-billing-and-credits-source.md)
- Retrieval date for every source below: **2026-10-27**
- Author: Claude B

## 1. How the sources were read, and what that limits

The task limits sources to first-party documentation for the supported Next.js, React, TypeScript, and Supabase host
and standard web primitives, and forbids provider material because no provider is selected. No payment provider, billing
account, or payment API was consulted or contacted.

Several documentation hosts did not resolve from the authoring environment (`getaddrinfo ENOTFOUND`): `nextjs.org`,
`supabase.com`, and `www.postgresql.org`. Every row below was therefore read from the publisher's own documentation
**source** in its public repository on `raw.githubusercontent.com` (`vercel/next.js` branch `canary`,
`supabase/supabase` branch `master`, and `postgres/postgres` branch `master`, which is the PostgreSQL project's
repository). That is the upstream text of the published page, but it can differ from the live page, and `canary` and
`master` can be ahead of the versions pinned in the fixture (Next.js `16.4.3`, `@supabase/supabase-js` `2.118.0`). The
published URLs given in section 8 were confirmed by a search result or derived from the source path; the published
pages themselves were not opened. Text was read through a page-summarizing fetch tool, so wording is a close paraphrase
with short quoted phrases only.

Search-result summaries were used only to locate pages. One search summary (that the Supabase JavaScript client has no
transaction grouping) was **not** used as evidence because the opened Supabase pages do not state it; see section 3.2.

## 2. Planning requirements and their status

From the planning boundary (research evidence, not approval). Nothing here is selected or defaulted.

| # | Package requirement | Status |
| --- | --- | --- |
| B1 | Atomic reserve, settle, and release | Required by the research; mechanism unresolved |
| B2 | Append-only accounting | Required by the research; mechanism unresolved |
| B3 | Idempotent ingestion | Required by the research; identity and mechanism unresolved |
| B4 | Provider reconciliation | Required by the research; provider and procedure unresolved |
| B5 | Concurrent requests cannot overspend | Critical verification in the research; control unresolved |
| B6 | A crash after provider success is reconciled without a double charge | Critical verification in the research; procedure unresolved |

The record also states the bounded first release (one currency or unit policy and one payment provider first; no general
banking ledger), the declared dependencies (transactions, jobs, a billing provider, and an authoritative usage source),
and that the package stays a candidate until it has a migration and effect plan, exact-commit evidence, operational
instructions, update and removal behavior, and the wider evidence gates.

## 3. Documented host capabilities

Each fact is what the cited page says, plus what that page does **not** say. Ids are defined in section 8.

### 3.1 Authenticated request boundaries (Next.js and Supabase Auth)

| Documented fact | Source | Not stated on the page |
| --- | --- | --- |
| Route Handlers are `route.js|ts` files under `app` using the Web `Request` and `Response` APIs, and the supported methods include `POST`; they are not cached by default. A body is read with standard methods such as `request.json()` and `request.formData()`. | N1 | Authorization, rate limits, execution limits, or reading a raw body for signature verification. |
| The data-security guide recommends a Data Access Layer that runs only on the server and performs authorization checks, says "only the Data Access Layer should access `process.env`", and says to treat Server Actions as reachable by direct `POST` and to verify authentication and authorization inside each. For `route.ts` files it says they "Have a lot of power" and need extra auditing. | N2 | Detailed authorization guidance for Route Handlers. |
| Environment variables are server-only by default; a `NEXT_PUBLIC_` prefix exposes a value to the browser and inlines it at build time. | N3 | A secrets-management mechanism. |
| Server code that must protect pages and user data should use `supabase.auth.getClaims()`. "Never trust `supabase.auth.getSession()` inside server code such as Proxy", because it reads the session from the cookie without revalidating it, and the page says anyone can forge the session cookie. A Proxy refreshes expired Auth tokens by calling `getClaims()`. | S1 | `getUser` is not mentioned on this page. |
| `getClaims()` "verifies the token's signature and expiry"; an unexpired token "stays valid even when the session behind it was revoked", and the page says that detecting a session ended on the server is done by fetching the user with `getUser()`. | S2 | Which method a billing boundary should use. That is a design decision. |

### 3.2 Persistent transactional data

| Documented fact | Source | Not stated on the page |
| --- | --- | --- |
| Every Supabase project "gets a full Postgres database, not a Postgres abstraction." | S3 | Transactions, ACID, or extensions. This page does not mention them. |
| Supabase database functions are Postgres SQL functions called with `rpc()`; the page recommends preferring `security invoker`, warns that "A `security definer` function can return rows the caller isn't allowed to read", and requires setting `search_path` for `security definer`. | S4 | Transactions or atomicity of a function call: the page does not mention them, and says only that the function returns the result of its final query. |
| The JavaScript `rpc` entry in the Supabase reference specification contains no description; it points to `@supabase/postgrest-js.PostgrestClient.rpc`. | S5 | Whether a single `rpc()` call runs in one transaction, and whether the JavaScript client groups several calls into one. **Not established** from the pages read. |
| PostgreSQL's default isolation level is Read Committed; Repeatable Read "only sees data committed before the transaction began"; Serializable "provides the strictest transaction isolation". Applications using Repeatable Read or Serializable "must be prepared to retry transactions due to serialization failures". Under Serializable, "it is possible to see unique constraint violations caused by conflicts with overlapping Serializable transactions", and retrying unique-key failures can be appropriate, though some might be "persistent error conditions rather than transient failures". | P1 | Which level, if any, a ledger needs. That is policy. |
| `SELECT ... FOR UPDATE` locks the retrieved rows and "prevents them from being locked, modified or deleted by other transactions until the current transaction ends". PostgreSQL "automatically detects deadlock situations and resolves them by aborting one of the transactions involved" (SQLSTATE `40P01`), and says deadlocks can be handled by retrying. | P1 | A recommended locking scheme for balances. |
| `INSERT ... ON CONFLICT DO NOTHING` avoids inserting a row; `ON CONFLICT DO UPDATE` "guarantees an atomic INSERT or UPDATE outcome", needs a conflict target, and only `NOT DEFERRABLE` constraints and unique indexes are supported as arbiters; `RETURNING` returns only rows that were inserted, updated, or selected. | P2 | An idempotency-key design. |
| `pg_net` starts HTTP requests only after the surrounding transaction commits ("HTTP requests are not started until the transaction is committed"). | S6 | A delivery guarantee or a way to confirm the outcome inside the same transaction. |

### 3.3 Authorization mechanisms

| Documented fact | Source | Not stated on the page |
| --- | --- | --- |
| With RLS enabled, no data is reachable through the API with a publishable key until policies exist; the page says to write a policy for each operation; `auth.uid()` returns the requesting user's id and is `null` without one. | S7 | A tenant or administrator model. |
| A secret key authorizes through the `service_role` role, which has `bypassrls`, and must never be used in a browser. Views bypass RLS by default; a `security definer` function runs with its creator's privileges and belongs outside an exposed schema, with `search_path = ''`. | S7 | Whether RLS can enforce that rows are append-only against `service_role`. The pages state that `service_role` bypasses RLS. Whether that matters for the accounting design is unresolved. |

### 3.4 Queues and scheduled background work

| Documented fact | Source | Not stated on the page |
| --- | --- | --- |
| Supabase Queues (`pgmq`) deliver "exactly once" to a consumer within a visibility timeout; `pop` yields at-most-once delivery if the consumer does not guarantee processing. `read_ct` "Increments on read()". A message can be archived instead of deleted "for long-term retention and replayability"; an unlogged queue trades durability for write throughput. | S8 | Retries, retry limits, backoff, dead-letter handling, or poison messages. |
| `pg_cron` schedules jobs with `cron.schedule()`; sub-minute schedules of 1 to 59 seconds need Postgres 15.1.1.61 or later; a job can run SQL, a database function, an HTTP request, or an Edge Function. Run history in `cron.job_run_details` "are not cleaned up automatically". | S9 | Concurrency limits or job-duration limits. |
| `pg_net` responses are kept by default for 6 hours in `net._http_response`, an UNLOGGED table the page says is not preserved during a crash or unclean shutdown; the default request timeout is 2000 ms; the page says it reliably handles up to 200 requests per second. The page contradicts itself on supported HTTP methods (it documents `http_get`, `http_post`, and `http_delete`, while a limitation says it "Can only make POST requests with JSON data"). | S6 | A durable record of an outcome. |
| `EdgeRuntime.waitUntil(promise)` keeps an Edge Function instance running until the promise completes, but the maximum duration "is capped based on the wall-clock, CPU, and memory limits". A `beforeunload` event announces shutdown. | S10 | The numeric limits, which sit on a page that was not read. |
| `after()` schedules work after the response and "will run for the platform's default or configured max duration of your route"; it runs even if the response fails, and where supported `maxDuration` sets the timeout. | N4 | Any delivery, retry, or durability guarantee. |

### 3.5 Audit and event constraints

| Documented fact | Source | Not stated on the page |
| --- | --- | --- |
| pgAudit "extends Postgres's built-in logging abilities"; its `write` category tracks changes to the database. Audit entries appear in the Dashboard's Postgres Logs. The page warns that logging can generate large volumes, "can noticeably reduce database performance", and "can expose sensitive values to your logs". | S11 | A retention period for audit logs, or that pgAudit output is an accounting record. |
| A trigger runs on table events, either `BEFORE` or `AFTER` the event, and can run `for each row` or `for each statement`. | S12 | Whether a trigger runs in the same transaction as the triggering statement, and whether it can raise an exception. The page mentions neither. |
| Database Webhooks are "a convenience wrapper around triggers using the `pg_net` extension", fire after a row change, and carry `type`, `table`, `schema`, `record`, and `old_record`. | S13 | Retries, ordering, or any delivery guarantee. |
| Vault stores encrypted secrets, exposes them decrypted through `vault.decrypted_secrets` ("Anyone that has access to the view has access to decrypted secrets"), and keeps the encryption key outside the database. | S14 | Per-tenant secrets or a rotation policy. |

## 4. The planning requirements against the documented evidence

This maps what the pages above document that bears on each requirement, and what the pages leave to another adapter.
It selects nothing. "Left open" means the pages read do not document it.

| Requirement | Relevant documented material | Left open |
| --- | --- | --- |
| B1 Atomic reserve, settle, release | Transaction isolation and retry guidance (P1); database functions called with `rpc()` (S4) | What a transaction boundary is for these operations. Whether one `rpc()` call is one transaction is **not established** (S4, S5). The reserve, settle, and release semantics are unresolved |
| B2 Append-only accounting | Per-operation RLS policies (S7); triggers (S12); pgAudit `write` logging (S11) | What makes the accounting append-only. `service_role` bypasses RLS (S7). A trigger's transaction and exception behavior is not stated (S12) |
| B3 Idempotent ingestion | `ON CONFLICT` atomic outcome and its unique-index requirement (P2); unique-violation retry guidance (P1); `pgmq` exactly-once only within the visibility timeout (S8) | The idempotency identity, where it is enforced, and how a replay is told apart from a new event |
| B4 Provider reconciliation | Scheduling and background primitives and their limits (S8, S9, S10, N4) | The provider, its events, and the reconciliation procedure. No provider material was read |
| B5 Concurrent overspend prevention | Row locks with `FOR UPDATE`, deadlock detection, and isolation levels with their retry requirement (P1) | The locking or isolation scheme, and the unit and rounding policy. The currency and unit policy is unresolved |
| B6 Crash after provider success | `pgmq` redelivery after the visibility timeout and archive (S8); `pg_net` responses are not crash-safe (S6); `after()` and `waitUntil` are bounded by duration limits (N4, S10) | The provider's success semantics, the evidence that a charge happened, and the reconciliation procedure. No documented guarantee covers this case |

## 5. Unresolved decisions (none decided here)

Each must be decided by a future approved ADR, from current official sources and the supported host's actual bindings.
"Bears on it" lists only relevant documentation; it is not a recommendation.

| Decision | Bears on it | Status |
| --- | --- | --- |
| Currency and unit policy | No page read; the research says one policy first | Unresolved |
| Billing provider | None: no provider is selected and none was researched | Unresolved |
| Authoritative usage source | None of the pages read; the research declares it a dependency | Unresolved |
| Ledger and transaction semantics (reserve, settle, release) | Transactions and isolation (P1), `rpc()` and functions (S4, S5) | Unresolved |
| Concurrency control and overspend prevention | Row locks, isolation, deadlocks (P1) | Unresolved |
| Idempotency identity and enforcement | `ON CONFLICT` (P2), unique violations (P1), `pgmq` visibility timeout (S8) | Unresolved |
| Provider event ingestion mechanism | Route Handlers (N1), authentication boundaries (S1, S2); the pages do not document reading a raw body or verifying a signature | Unresolved |
| Reconciliation procedure | Background primitives and limits (S8, S9, S10, N4) | Unresolved |
| Adjustments and refunds | None of the pages read | Unresolved |
| Budgets | None of the pages read | Unresolved |
| Jobs and scheduler adapter | `pgmq`, `pg_cron`, Edge `waitUntil`, `after()` are each documented; none is chosen | Unresolved |
| Tenant and authorization model | RLS and `service_role` (S7), Data Access Layer (N2), auth methods (S1, S2); the accepted Import Center ADR holds the repository's own tenant pattern | Unresolved |
| Accounting and audit retention | pgAudit and `cron.job_run_details` retention are not addressed or not cleaned up (S11, S9); `pgmq` archive keeps messages (S8) | Unresolved |

Also unresolved, because the research record leaves them open or the pages read do not settle them: the ledger schema,
the hosting target for background work and its duration limits, whether the supabase-js client can group statements into
one transaction, and the operator reconciliation workflow.

## 6. Conflicts, inconsistencies, and repository boundary

- **Accepted repository scope prevails.** Import Center is the only implemented reference-host feature. The accepted
  Import Center task and ADR 0002 authorize only that local reference host, and no Usage Billing and Credits task, ADR,
  provider, credential, account, or local provisioning is approved.
- **The repository's own queue is not a platform primitive.** ADR 0002 uses `pgmq` for the Import Center fixture only.
  The research record calls job and audit primitives shared dependencies, not completed platform capabilities.
- **`pg_net` page contradicts itself on methods** (section 3.4). Which statement is current is unresolved.
- **Documentation branches.** Text was read from `canary` and `master`, which can be ahead of the pinned versions. An ADR
  must re-read the published pages for the pinned versions.
- **Auth method wording.** One Supabase page says to use `getClaims()` to protect pages and user data, while another
  says detecting an ended session needs `getUser()`. They are consistent (the second names a limit of the first), and
  which applies to a billing boundary is a design decision.

## 7. What was not read

No claim depends on these; each must be read at ADR time: the PostgREST documentation (to settle whether one `rpc()`
call is one transaction, and how the JavaScript client treats several calls), the published Next.js, Supabase, and
PostgreSQL pages for the pinned versions, Supabase Edge Function and platform limits, the Supabase Realtime and
`supa_audit` material, the HTTP specifications on retries and idempotent methods, any payment provider's documentation
(none is selected, and the task forbids it), and the PostgreSQL documentation on numeric and money types.

## 8. Sources

All retrieved 2026-10-27. "Source path" is the file read; a path starting with `...` continues the repository and branch
named in the row above it.

| Id | Published page | Source path read | Access |
| --- | --- | --- | --- |
| N1 | [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) | `vercel/next.js` `canary` `docs/01-app/01-getting-started/15-route-handlers.mdx` | Source |
| N2 | [Data security](https://nextjs.org/docs/app/guides/data-security) | `docs/01-app/02-guides/data-security.mdx` | Source |
| N3 | [Environment variables](https://nextjs.org/docs/app/guides/environment-variables) (URL derived from the source path) | `docs/01-app/02-guides/environment-variables.mdx` | Source |
| N4 | [`after`](https://nextjs.org/docs/app/api-reference/functions/after) | `docs/01-app/03-api-reference/04-functions/after.mdx` | Source |
| S1 | [Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client) | `supabase/supabase` `master` `apps/docs/content/guides/auth/server-side/creating-a-client.mdx` | Source |
| S2 | [Advanced guide](https://supabase.com/docs/guides/auth/server-side/advanced-guide) | `.../guides/auth/server-side/advanced-guide.mdx` | Source |
| S3 | [Database overview](https://supabase.com/docs/guides/database/overview) (URL derived) | `.../guides/database/overview.mdx` | Source |
| S4 | [Database functions](https://supabase.com/docs/guides/database/functions) (URL derived) | `.../guides/database/functions.mdx` | Source |
| S5 | [JavaScript reference: rpc](https://supabase.com/docs/reference/javascript/rpc) | `apps/docs/spec/supabase_js_v2.yml` (the `rpc` entry; the file's other parts were not read) | Source |
| S6 | [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net) | `.../guides/database/extensions/pg_net.mdx` | Source |
| S7 | [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) | `.../guides/database/postgres/row-level-security.mdx` | Source |
| S8 | [PGMQ extension](https://supabase.com/docs/guides/queues/pgmq) | `.../guides/queues/pgmq.mdx` | Source |
| S9 | [Cron quickstart](https://supabase.com/docs/guides/cron/quickstart) | `.../guides/cron/quickstart.mdx` | Source |
| S10 | [Background tasks](https://supabase.com/docs/guides/functions/background-tasks) (URL derived) | `.../guides/functions/background-tasks.mdx` | Source |
| S11 | [pgAudit](https://supabase.com/docs/guides/database/extensions/pgaudit) (URL derived) | `.../guides/database/extensions/pgaudit.mdx` | Source |
| S12 | [Triggers](https://supabase.com/docs/guides/database/postgres/triggers) (URL derived) | `.../guides/database/postgres/triggers.mdx` | Source |
| S13 | [Database Webhooks](https://supabase.com/docs/guides/database/webhooks) | `.../guides/database/webhooks.mdx` | Source |
| S14 | [Vault](https://supabase.com/docs/guides/database/vault) (URL derived) | `.../guides/database/vault.mdx` | Source |
| P1 | [PostgreSQL: Concurrency Control](https://www.postgresql.org/docs/current/mvcc.html) (URL derived) | `postgres/postgres` `master` `doc/src/sgml/mvcc.sgml` | Source |
| P2 | [PostgreSQL: INSERT](https://www.postgresql.org/docs/current/sql-insert.html) (URL derived) | `doc/src/sgml/ref/insert.sgml` | Source |

## 9. Source and license note

This section records the notices that the publishers' own repositories state, as evidence only. It is **not legal
advice**, it does not interpret any notice, and it concludes nothing about copying, quotation, redistribution,
attribution, compatibility, or fair use. It does not resolve the human legal-review gate.

| Source | Repository and branch | File and notice as stated | Published documentation terms |
| --- | --- | --- | --- |
| Next.js, Vercel | `vercel/next.js`, `canary` | `license.md`: "The MIT License (MIT)", "Copyright (c) 2025 Vercel, Inc." | Not established: `nextjs.org` was unreachable |
| Supabase | `supabase/supabase`, `master` | `LICENSE`: "Apache License", "Version 2.0, January 2004", "Copyright 2024 Supabase". The file does not name `apps/docs` or documentation content as covered or excluded. The root `README.md` and `apps/docs/README.md` state no license | Not established: `supabase.com` was unreachable |
| PostgreSQL | `postgres/postgres`, `master` | `COPYRIGHT`: it states no license name; its permission notice begins "Permission to use, copy, modify, and distribute this software and its documentation for any purpose, without fee, and without a written agreement"; lines "Portions Copyright (c) 1996-2026, PostgreSQL Global Development Group" and "Portions Copyright (c) 1994, The Regents of the University of California" | Not established: `www.postgresql.org` was unreachable |

Exact commit SHAs or tags are **not established** for any repository: the GitHub API returned HTTP 403, so the files
were read from the named branches only. This dossier paraphrases and quotes only short phrases, links to each
publisher, and copies no documentation text into code. The Supabase and PostgreSQL licenses were read for this task;
the Next.js license was read on the same date in the Webhook dossier's provenance work. Any ADR that adopts a library,
provider, vendor, service, or copied material needs its own license review by the appropriate human owner, and the
research record's source and license gate stays open until that review exists. No external capability was tested, no
payment or provider behavior was tested, and no request was made to any provider.

## 10. Proposed next step only

A separately approved ADR and task, after the coordinator decides the items in section 5, re-reads the published pages
for the pinned versions, and completes section 7. This dossier gives no effort estimate, release promise, or claim that
any capability, payment, or provider behavior was tested.
