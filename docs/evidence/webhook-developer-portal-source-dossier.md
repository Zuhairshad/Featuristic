# Webhook Developer Portal source dossier

> Status: **research evidence, not approval.** This dossier does not authorize a Webhook Developer Portal task,
> ADR, implementation, dependency, migration, outbound request, or secret configuration. It chooses no
> architecture, algorithm, vendor, schema, retry schedule, or policy default.

- Task: [`docs/tasks/webhook-developer-portal-source-dossier.md`](../tasks/webhook-developer-portal-source-dossier.md)
- Planning boundary: [`docs/roadmap/webhook-developer-portal-source.md`](../roadmap/webhook-developer-portal-source.md)
- Retrieval date for every source below: **2026-10-27**
- Author: Claude B

## 1. How the sources were read, and what that limits

Several documentation hosts did not resolve from the authoring environment (`getaddrinfo ENOTFOUND`):
`nextjs.org`, `supabase.com`, `rfc-editor.org`, `datatracker.ietf.org`, `iana.org`, `httpwg.org`, and
`fetch.spec.whatwg.org`. The published Node.js documentation at `nodejs.org` did resolve. Text was read through a
page-summarizing fetch tool, so wording below is a close paraphrase with only short quoted phrases. Evidence has
three access levels, stated on every row:

| Level | Meaning |
| --- | --- |
| **Page** | The published page was opened (Node.js documentation at `nodejs.org`). |
| **Source** | The Markdown source of the publisher's own documentation was opened from its public repository on `raw.githubusercontent.com` (`vercel/next.js` branch `canary`; `supabase/supabase` branch `master`; `OWASP/CheatSheetSeries` branch `master`). That is the upstream text of the published page, but it can differ from the live page, and `canary` and `master` can describe behavior newer than a released version. The published URLs given for these rows were confirmed by a search result or derived from the source path; the published pages themselves were not opened. |
| **Not read** | Named in section 8 as a source to read at ADR time. No claim in this dossier depends on it. |

One discarded claim: a search-result summary said Supabase's `pg_net` documentation warns that credentials sent in
request headers are readable by every role that can connect. The opened source text of that page contains **no
such warning**, so the claim was dropped. This is why search summaries were not used as evidence.

## 2. What the canonical research record requires

From the planning boundary (research evidence, not approval). Nothing here is selected or defaulted:

| # | Research package requirement |
| --- | --- |
| R1 | Signed deliveries |
| R2 | Bounded retries |
| R3 | Endpoint validation |
| R4 | Delivery accounting |
| R5 | Payload redaction (in attempt detail) |
| R6 | Forbidden-destination blocking |
| R7 | Stable event identity after a receiver commits but times out |

The record also states the bounded first release (outbound webhooks only, a fixed event catalog, documented
ordering guarantees), the declared dependencies (queue, outbound networking, secrets, transactional event
source), and that the research does not settle tenant and authorization model, event-source data model,
endpoint storage, secret lifecycle, retry schedule, signature algorithm, egress guard, replay authorization,
retention, or worker/scheduler adapter.

## 3. Documented capabilities of the supported host

Each fact is what the cited page says, plus what that page does **not** say. Sources are listed in section 7.

### 3.1 Route and server boundaries (Next.js App Router)

| Documented fact | Source (access) | Not stated on the page |
| --- | --- | --- |
| Route Handlers are defined in `route.js|ts` under `app`, support `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`, and return `405` for an unsupported method. They use the Web `Request` and `Response` APIs. | N1 (Source) | Authorization, rate limits, or execution limits for handlers. |
| Route Handlers "are not cached by default"; only `GET` can opt into caching. | N1 (Source) | Segment config such as `maxDuration`. The page shows only the `dynamic` option and does not discuss long-running work. |
| `after()` schedules work to run after the response (or prerender) finishes. It works in Server Components, Server Functions, Route Handlers, and Proxy. It runs even if the response fails. | N2 (Source) | Any delivery, retry, or durability guarantee. |
| `after` "will run for the platform's default or configured max duration of your route"; where supported, `maxDuration` sets the timeout. On serverless it relies on a `waitUntil(promise)` primitive. Supported on Node.js servers and Docker containers; not on static export; adapters are platform-specific. | N2 (Source) | What happens to unfinished work at the limit, or graceful shutdown. |
| Environment variables are server-only by default. A `NEXT_PUBLIC_` prefix exposes a value to the browser and inlines it at build time, after which it is frozen. `.env*` files load in a listed order. | N3 (Source) | A secrets-management mechanism. The only warning is not to commit `.env` files. |
| The security guide recommends a Data Access Layer that runs only on the server, performs authorization checks and returns minimal data, and says "only the Data Access Layer should access `process.env`." It says to treat Server Actions as reachable by direct `POST` and to verify authentication and authorization inside each. For `route.ts` files it says they "Have a lot of power" and need extra auditing. | N4 (Source) | Detailed authorization guidance for Route Handlers. |

### 3.2 Persistent transactional data and the boundary around it (Supabase)

| Documented fact | Source (access) | Not stated on the page |
| --- | --- | --- |
| Every Supabase project "gets a full Postgres database, not a Postgres abstraction." | S1 (Source) | Transactions, ACID, or extensions. This page does not mention them, and Postgres's own documentation was not read. |
| With RLS enabled, no data is reachable through the API with a publishable key until policies exist. `auth.uid()` returns the requesting user's id and is `null` without one. A secret key uses the `service_role` role, which has `bypassrls`, and must never be used in a browser. Views bypass RLS by default; a `security definer` function runs with its creator's privileges and should not live in an exposed schema, with `search_path = ''`. | S2 (Source) | A tenant or admin model. These are mechanisms, not a design. |
| `pg_net` makes asynchronous HTTP/HTTPS requests from SQL. "HTTP requests are not started until the transaction is committed." Waiting requests are held in `net.http_request_queue` and deleted when run. | S3 (Source) | A delivery guarantee, retry, or an allow or deny control on destinations. |
| `pg_net` responses are stored by default for 6 hours in `net._http_response`, an UNLOGGED table, which the page says is not preserved during a crash or unclean shutdown. The default request timeout is 2000 ms. The page says it reliably handles up to 200 requests per second. The `net` schema grants `USAGE` to `PUBLIC` by default and is not exposed through the Data API. | S3 (Source) | A durable accounting record. Dropping the extension deletes queued requests. |
| Database Webhooks are "a convenience wrapper around triggers using the `pg_net` extension." Events (`INSERT`, `UPDATE`, `DELETE`) fire after the row change. The payload has `type`, `table`, `schema`, `record`, and `old_record`. | S4 (Source) | Retries, ordering, or at-least-once or exactly-once delivery. The page states no delivery guarantee. |

### 3.3 Secret handling

| Documented fact | Source (access) | Not stated on the page |
| --- | --- | --- |
| Vault stores encrypted secrets in the database, authenticated and encrypted on disk, exposed decrypted through the `vault.decrypted_secrets` view. "Anyone that has access to the view has access to decrypted secrets", so protect it with SQL privileges. The encryption key is "never stored in the database alongside the encrypted data." `vault.create_secret()` and `vault.update_secret()` exist. A `pg_dump` restore to a new project cannot decrypt old secrets without the old root key. | S5 (Source) | Rotation or reveal-once behavior, or handling of decrypted output outside the database. |
| Edge Function secrets are set with the dashboard or `supabase secrets set`; a name cannot start with `SUPABASE_`; a new secret is read immediately without redeploy; default secrets include `SUPABASE_SECRET_KEYS`, which bypass RLS and must never be used in a browser. Committing a `.env` file exposes every secret in it. | S6 (Source) | Per-tenant or per-endpoint secrets. |
| In a Database Webhook that calls out with a secret key, the key is saved in the trigger definition and can leak through database dumps; the page recommends keeping the URL and key in Vault and reading them from a `security definer` trigger function. | S4 (Source) | A signing mechanism for outgoing payloads. |

### 3.4 Queue and background primitives

| Documented fact | Source (access) | Not stated on the page |
| --- | --- | --- |
| Supabase Queues (`pgmq`) provide "exactly once" delivery to a consumer within a visibility timeout; `pop` yields at-most-once delivery if the consumer does not guarantee processing. The visibility timeout (VT) is the time a message is invisible to other consumers, `set_vt` changes it, and `read_ct` is the number of times a message has been read ("Increments on read()"). Messages can be archived instead of deleted "for long-term retention and replayability"; an unlogged queue trades durability for throughput. | S7 (Source) | Retries, retry limits, backoff, dead-letter handling, or poison messages. The page does not mention them. |
| `pg_cron` schedules jobs with `cron.schedule()`; sub-minute schedules of 1 to 59 seconds need Postgres 15.1.1.61 or later. A job can run SQL, a database function, an HTTP request, or an Edge Function (the Edge Function example uses `net.http_post` and needs `pg_net`). Run history is in `cron.job_run_details` and "are not cleaned up automatically." | S8 (Source) | Concurrency limits or job-duration limits. |
| `EdgeRuntime.waitUntil(promise)` keeps an Edge Function instance running until the promise completes, but "The maximum duration is capped based on the wall-clock, CPU, and memory limits", and the function shuts down at those limits. A `beforeunload` event announces shutdown. Locally, instances terminate after the request unless `policy = "per_worker"` is set. | S9 (Source) | The numeric limits, which sit on a separate page that was not read. |

### 3.5 Generic HTTP and web-security primitives

| Documented fact | Source (access) | Not stated on the page |
| --- | --- | --- |
| Node.js global `fetch` is "a browser-compatible implementation", based on undici, no longer experimental since v21.0.0, and accepts a custom `dispatcher`. `AbortSignal.timeout(delay)` returns a signal aborted after `delay` milliseconds. | G1 (Page) | Behavior on redirects or destination restrictions; request and response members are deferred to MDN. |
| `dns.lookup()` resolves to the first A or AAAA record by default; `options.all` returns every address; it "does not necessarily have anything to do with the DNS protocol", uses the operating system (`getaddrinfo(3)`) on libuv's threadpool, and differs from `dns.resolve*()`, which always query the network. | G2 (Page) | A way to pin a validated address to the later connection. |
| `net.isIP()` returns `6`, `4`, or `0`; IPv4 with leading zeroes is rejected; an IPv4-mapped IPv6 address counts as IPv6. `net.BlockList` has `addAddress`, `addRange`, `addSubnet`, and `check`, and its example shows IPv4-mapped IPv6 forms matching an IPv4 rule. | G3 (Page) | Which ranges to include. That is policy. |
| `crypto.createHmac(algorithm, key[, options])` returns an `Hmac`; "HMAC imposes additional restrictions, so not every listed algorithm is suitable", and for keys from a secure entropy source the length should not exceed the algorithm's block size. | G4 (Page) | A signing format or header convention. |
| The page's cross-reference says to compare equal-length `Buffer` values with `crypto.timingSafeEqual()` when verifying an authentication tag. | G4 (Page) | The body of the `crypto.timingSafeEqual` section was **not read**: the fetch window ended before it. Its signature and exception behavior are therefore not recorded here. |
| OWASP's SSRF prevention guide prefers allow-lists ("Deny-lists are bypass-prone. Prefer allow-lists."), and where destinations are unknown says the block-list approach "is not an impenetrable wall". It says to resolve a domain, retrieve all its addresses and check each one; that allow-listing a domain does not prevent DNS rebinding; that "a second, unchecked DNS lookup between validation and connection can bypass these checks"; to connect to the validated IP while preserving the original hostname; to apply the destination policy "to retries and fallback connections as well"; and to disable redirects. Its minimum deny-list names loopback, RFC 1918, `fc00::/7`, `fe80::/10`, multicast, and cloud metadata addresses. | G5 (Source) | Response handling and port restrictions beyond the points quoted. This is community standards guidance, not vendor documentation. |

## 4. The research requirements against the documented evidence

This maps what the pages above document that is **relevant** to each requirement, and what the pages leave to
another adapter. It selects nothing. "Supplied elsewhere" means the pages read do not document it.

| Requirement | Relevant documented material | Left to be supplied or decided |
| --- | --- | --- |
| R1 Signed deliveries | `crypto.createHmac` exists (G4); the algorithm-restriction note applies; Vault and Edge secrets hold secrets (S5, S6) | Signing format, algorithm, header convention, key scope and rotation |
| R2 Bounded retries | `pgmq` VT, `read_ct`, archive (S7); `pg_cron` scheduling (S8) | Retry limits, backoff, dead-letter handling: the pages state none. The retry schedule is unresolved |
| R3 Endpoint validation | `net.isIP`, `net.BlockList` (G3); `dns.lookup` with `all` (G2); OWASP resolve-and-check (G5) | What counts as valid; allow-list versus deny-list; scheme and port policy |
| R4 Delivery accounting | A full Postgres database (S1); `pg_net` keeps responses in an UNLOGGED table for 6 hours by default (S3) | The accounting model and its durable storage. The page describes `net._http_response` as non-durable |
| R5 Payload redaction | None of the pages read documents a redaction primitive | Redaction rules and where applied |
| R6 Forbidden-destination blocking | `net.BlockList` (G3); OWASP minimum ranges and rebinding guidance (G5); `pg_net` page states no destination control (S3) | The forbidden set, enforcement point, DNS-rebinding handling, redirect handling, retry-path enforcement |
| R7 Stable event identity after timeout | `pgmq` redelivers after the VT expires (S7); `pg_net` starts requests only after commit (S3) | An event identifier and its stability across retries: no page defines one |

## 5. Unresolved product and host-binding decisions (none decided here)

Each item must be decided by a future approved ADR, from current official sources and the host's actual bindings.
"Bears on it" lists only documentation that is relevant; it is not a recommendation.

| Decision | Bears on it | Status |
| --- | --- | --- |
| Tenant and admin authority | RLS, `auth.uid()`, security-definer cautions (S2); Next.js Data Access Layer and Server Action guidance (N4); the accepted Import Center ADR for the repository's own tenant pattern | Unresolved |
| Event sources | Database Webhooks and `pg_net` fire after commit with no stated guarantee (S3, S4) | Unresolved |
| Storage retention | `net._http_response` 6-hour default (S3); `cron.job_run_details` is not cleaned up (S8); `pgmq` archive keeps messages (S7) | Unresolved |
| Endpoint ownership | RLS mechanisms (S2) | Unresolved |
| Secret rotation and reveal policy | Vault update, view access warning (S5); Edge secrets (S6) | Unresolved |
| Egress policy | OWASP (G5); `net.BlockList` (G3) | Unresolved |
| Replay permissions | `pgmq` archive for replayability (S7); RLS (S2) | Unresolved |
| Idempotency | `pgmq` exactly once only within the VT (S7) | Unresolved |
| Ordering guarantee | No page read states an ordering guarantee for delivery | Unresolved |
| Operator workflow | None of the pages read | Unresolved |

Also unresolved, because the research record leaves them open: signature algorithm and format, retry schedule,
the worker or scheduler adapter (in-process `after()`, Edge `waitUntil`, `pgmq` consumer, or `pg_cron`: each is
documented, none is chosen), the hosting target for background work and its duration limits, and the event-source
data model.

## 6. Conflicts, inconsistencies, and repository boundary

- **Accepted repository scope prevails.** `docs/tasks/import-center.md` says not to implement webhooks and lists
  webhook delivery as needing a separate approved task and ADR; ADR 0002 places `feature/webhook-portal` outside
  the Import Center task. No webhook task or ADR is approved.
- **The repository's own queue is not a platform primitive.** ADR 0002 uses `pgmq` for the Import Center
  reference host fixture only. The research record calls job and audit primitives shared dependencies, not
  completed platform capabilities.
- **`pg_net` page contradicts itself on methods.** It documents `http_get`, `http_post`, and `http_delete`, while
  its Limitations section says it "Can only make POST requests with JSON data." The inconsistency is recorded as
  found; which statement is current is unresolved.
- **Documentation branches.** The Next.js and Supabase text was read from `canary` and `master`, which can be
  ahead of the versions pinned in the fixture (Next.js `16.4.3`, `@supabase/supabase-js` `2.118.0`). The ADR stage
  must re-read the published pages for the pinned versions.
- **Vendor versus community guidance.** OWASP (G5) is standards-community guidance, not host documentation.

## 7. Sources

All retrieved 2026-10-27. "Source path" is the file read; the published URL is where the page lives.

| Id | Published page | Source read | Access |
| --- | --- | --- | --- |
| N1 | [Route Handlers](https://nextjs.org/docs/app/getting-started/route-handlers) | `vercel/next.js` `canary` `docs/01-app/01-getting-started/15-route-handlers.mdx` | Source |
| N2 | [`after`](https://nextjs.org/docs/app/api-reference/functions/after) | `docs/01-app/03-api-reference/04-functions/after.mdx` | Source |
| N3 | [Environment variables](https://nextjs.org/docs/app/guides/environment-variables) (URL derived from the source path) | `docs/01-app/02-guides/environment-variables.mdx` | Source |
| N4 | [Data security](https://nextjs.org/docs/app/guides/data-security) | `docs/01-app/02-guides/data-security.mdx` | Source |
| S1 | [Database overview](https://supabase.com/docs/guides/database/overview) (URL derived) | `supabase/supabase` `master` `apps/docs/content/guides/database/overview.mdx` | Source |
| S2 | [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) | `.../guides/database/postgres/row-level-security.mdx` | Source |
| S3 | [pg_net](https://supabase.com/docs/guides/database/extensions/pg_net) | `.../guides/database/extensions/pg_net.mdx` | Source |
| S4 | [Database Webhooks](https://supabase.com/docs/guides/database/webhooks) | `.../guides/database/webhooks.mdx` (a referenced partial was not included) | Source |
| S5 | [Vault](https://supabase.com/docs/guides/database/vault) (URL derived) | `.../guides/database/vault.mdx` | Source |
| S6 | [Edge Function secrets](https://supabase.com/docs/guides/functions/secrets) (URL derived) | `.../guides/functions/secrets.mdx` | Source |
| S7 | [PGMQ extension](https://supabase.com/docs/guides/queues/pgmq) | `.../guides/queues/pgmq.mdx` | Source |
| S8 | [Cron quickstart](https://supabase.com/docs/guides/cron/quickstart) | `.../guides/cron/quickstart.mdx` | Source |
| S9 | [Background tasks](https://supabase.com/docs/guides/functions/background-tasks) (URL derived) | `.../guides/functions/background-tasks.mdx` | Source |
| G1 | [Node.js globals](https://nodejs.org/api/globals.html) (Node.js v26.12.1 documentation) | the published page | Page |
| G2 | [Node.js dns](https://nodejs.org/api/dns.html) | the published page | Page |
| G3 | [Node.js net](https://nodejs.org/api/net.html) | the published page | Page |
| G4 | [Node.js crypto](https://nodejs.org/api/crypto.html) | the published page (330,076 characters; the section body of `crypto.timingSafeEqual` was not read) | Page |
| G5 | [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html) (URL derived) | `OWASP/CheatSheetSeries` `master` `cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.md` | Source |

## 8. Not read; to read at ADR time (no claim here depends on them)

IETF RFC 2104 (HMAC) and RFC 9110 (HTTP semantics), the IANA special-purpose IPv4 and IPv6 address registries, the
WHATWG Fetch Standard (redirect handling), the published Next.js and Supabase pages for the pinned versions,
Supabase Edge Function limits, Postgres's own transaction documentation, and the `crypto.timingSafeEqual` section.

## 9. Source and license note

These are documentation sources whose license terms were **not reviewed** in this task. This dossier paraphrases
and quotes only short phrases, links to each publisher, and copies no documentation text into code. The research
record's source and license evidence gate is therefore not satisfied by this dossier; a license review of each
source, and of any library or service an ADR proposes, is required at the ADR stage. No external capability was
tested, and no outbound request was made to any webhook receiver.

## 10. Proposed next step only

A separately approved ADR and task, after the coordinator decides the items in section 5, re-reads the published
pages for the pinned versions, and completes section 8. This dossier gives no effort estimate, release promise, or
claim that any capability was tested.

## 11. Source provenance and license notices (added 2026-10-27; factual only)

This section collects the license notices that the publishers' own repositories state for the documentation
sources cited above. It is **evidence collection only. It is not legal advice**, it does not interpret any notice,
and it concludes nothing about copying, quotation, redistribution, attribution obligations, license
compatibility, or fair use. It does **not** resolve the human legal-review gate. It replaces only the statement in
section 9 that no notice had been looked at; the legal review that section 9 requires is still open.

### 11.1 Method and limits

- Retrieved 2026-10-27 through the same page-summarizing fetch tool as the rest of this dossier, from the
  publishers' own repositories on `raw.githubusercontent.com`. Only short identifying phrases are quoted, and no
  license text is copied here.
- **Revisions:** the files were read from the named branch. The GitHub API returned HTTP 403 for the branch-head
  lookup of all four repositories, so an exact commit SHA or tag is **not established** for any of them.
- First-party published pages were not usable for notices: `nextjs.org` and `supabase.com` did not resolve, and
  `cheatsheetseries.owasp.org` was not opened. Where only a repository notice was available, the table says so.
- Coverage: every publisher or repository cited in sections 3 and 7 is listed (Next.js and Vercel, Supabase,
  Node.js, OWASP). No secondary license summary was used.

### 11.2 Notices found

| Source (dossier ids) | Repository and branch read | File read and exact URL | Notice as stated in the file | Published documentation terms |
| --- | --- | --- | --- | --- |
| Next.js, Vercel (N1 to N4) | `vercel/next.js`, branch `canary` | `license.md`: <https://raw.githubusercontent.com/vercel/next.js/canary/license.md> | Titled "The MIT License (MIT)", with the line "Copyright (c) 2025 Vercel, Inc." The file does not name a directory or content type; its text defines "Software" as "this software and associated documentation files". | **Not established.** `nextjs.org` was unreachable. A `README.md` read at the same branch returned HTTP 404, so no README notice was read. |
| Supabase (S1 to S9) | `supabase/supabase`, branch `master` | `LICENSE`: <https://raw.githubusercontent.com/supabase/supabase/master/LICENSE> | Titled "Apache License", "Version 2.0, January 2004", with the line "Copyright 2024 Supabase". The file does not say it covers or excludes `apps/docs` or any documentation content. | **Not established.** `supabase.com` was unreachable. The root `README.md` has no License section (its badges state no license), and `apps/docs/README.md` has no license statement. |
| Node.js (G1 to G4) | `nodejs/node`, branch `main` | `LICENSE`: <https://raw.githubusercontent.com/nodejs/node/main/LICENSE> | Opens "Node.js is licensed for use as follows:", with the line "Copyright Node.js contributors. All rights reserved." The grant text refers to "associated documentation files". No separate documentation terms were found in the part read. The file lists externally maintained components under their own licenses (examples named: Acorn, c-ares, LIEF, OpenSSL, V8, libuv, undici) and gives different terms for the ICU "Data Files" (Unicode License V3). | **Not established** for the published pages as a whole. `https://nodejs.org/api/documentation.html` contains no license notice in its page text. `doc/README.md` in the repository has no license statement. |
| OWASP (G5) | `OWASP/CheatSheetSeries`, branch `master` | `LICENSE.md`: <https://raw.githubusercontent.com/OWASP/CheatSheetSeries/master/LICENSE.md> (a read of `LICENSE` returned HTTP 404) | Titled "Attribution-ShareAlike 4.0 International", with SPDX identifier CC-BY-SA-4.0 as stated in the file. No standalone copyright line; the text names Creative Commons Corporation as the publisher of the license text. The file defines "Licensed Material" generally and does not name a particular cheat sheet. | **Not established.** `README.md` has no License section; its only reference is a badge with alt text "Creative Commons License" and title "CC BY-SA 4.0" linking to `creativecommons.org/licenses/by-sa/4.0/`, and the README does not say which content the badge covers. Whether the specific cheat sheet file read (`cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.md`) carries its own notice was not checked. |

### 11.3 Parts not read, and what was not established

- Node.js `LICENSE` is 154,603 characters; only the first 100,000 were read, so the remaining 54,603 characters
  (further third-party notices) were not.
- Exact commit SHAs or tags for all four repositories: not established.
- Published documentation terms for the Next.js, Supabase, and OWASP sites, and any terms-of-use page of any
  publisher: not established.
- Whether a repository-level license applies to the documentation content of that repository is a question this
  section does not answer. The files above are recorded as found.

### 11.4 Legal-review gate: still unresolved

This evidence does not decide whether anything in this dossier, or any later Webhook Developer Portal work, may be
quoted, copied, adapted, attributed, or distributed. Any ADR that adopts a library, vendor, service, or copied
material needs its own license review by the appropriate human owner, and the research record's source and
license gate stays open until that review exists. Every research label, assumption, and unresolved decision in
sections 1 to 10 is unchanged by this section.
