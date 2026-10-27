# Approval Workflows source dossier

> Status: **research evidence, not approval.** This dossier does not authorize an Approval Workflows ADR,
> implementation task, migration, dependency, notification, scheduler, credential, or remote-service configuration.
> It chooses no state schema, policy, scheduler, concurrency scheme, or notification vendor.

- Task: [`docs/tasks/approval-workflows-source-dossier.md`](../tasks/approval-workflows-source-dossier.md)
- Planning boundary: [`docs/roadmap/approval-workflows-source.md`](../roadmap/approval-workflows-source.md)
- Retrieval date for every source below: **2026-10-27**
- Author: Claude A

## 1. How the sources were read, and what that limits

Every source below is a **published first-party documentation page that was opened directly** from the authoring
environment with `curl`, with markup stripped and the text searched. Wording is a close paraphrase with only short
quoted phrases. Nothing was run, called or tested, and no remote account, notification service or endpoint was used.

Three limits matter when relying on these rows:

- **The pages are living documents.** An ADR must re-read each page for the versions it actually targets.
- **Version differences.** The Next.js pages are labelled "Latest v16.4.3", the version the Import Center fixture
  pins. The PostgreSQL pages are the **PostgreSQL 18** ("Current") documentation, whereas the fixture's local
  Supabase stack runs Postgres 17 (from `supabase/config.toml`); the cited concurrency pages describe long-standing
  behavior, but that was not re-checked against the version 17 pages. The Supabase pages carry no version label.
- **Hosted versus local.** Some Supabase pages say "the hosted Supabase Platform" supports a feature. Whether the same
  feature exists in the local CLI stack used by the fixture is **not stated** on those pages and was not checked.

PostgreSQL's own documentation is included because the Supabase pages state that a project has a Postgres database
(see the dossier for the Webhook candidate) and the planning record's concurrency requirement is a database
question. It is upstream database documentation, not Supabase documentation, and is labelled that way throughout.

## 2. What the canonical research record requires

From the planning boundary (research evidence, not approval). Nothing here is selected or defaulted.

| # | Package requirement |
| --- | --- |
| A1 | Versioned state machine (backend deliverable) |
| A2 | Authorized transitions (backend deliverable) |
| A3 | Durable timers (backend deliverable) |
| A4 | Escalation (backend deliverable) |
| A5 | Audit events (backend deliverable) |
| A6 | Sequential stages only in the bounded first release; no arbitrary user code or unrestricted visual programming |
| A7 | Concurrent approval and cancellation produce exactly one valid terminal state |
| A8 | A requester cannot self-approve under the separation policy |

The record also gives the outcome (submit requests, assign reviewers, comment, approve or reject, receive reminders,
inspect history), the frontend deliverables (reviewer inbox, request detail, stage editor, timeline), and the declared
dependencies: identity, permissions, durable scheduler, notifications.

## 3. Documented capabilities of the supported host

Each row is what the cited page says, plus what that page does **not** say. "Not stated" means absent from the page
read; it does not mean the opposite is true. Sources are listed in section 7.

### 3.1 Authenticated request boundaries (Next.js App Router)

| Documented fact | Source | Not stated on the page |
| --- | --- | --- |
| Authentication has three parts: authentication, session management and authorization. The guide recommends an authentication library for "increased security and simplicity" over a custom solution. | N1 | Any approval, reviewer or role model. |
| For authorization checks the guide recommends a Data Access Layer to centralize authorization logic and Data Transfer Objects that return only the data needed, and says Proxy may be used for **optimistic** checks. It warns that Proxy "should not be your only line of defense" and that the majority of security checks belong "as close as possible to your data source". | N1 | How to model stage-level permissions. |
| Proxy runs on every request unless a `matcher` is set (including static files); the authentication guide notes Proxy uses the Node.js runtime. | N1, N2 | Session-lookup cost or latency limits for Proxy. |
| A Server Action that is created and exported "is reachable via a direct POST request, not just through your application's UI". The security guide advises verifying authentication and authorization inside each action, says only the Data Access Layer should read `process.env`, and says `proxy.ts` and `route.ts` "have a lot of power" and deserve extra auditing. | N3 | Rate limits or per-action authorization primitives. |
| `after()` schedules work to run after the response finishes, in Server Components, Server Functions, Route Handlers and Proxy; it runs "for the platform's default or configured max duration of your route" and "even if the response didn't complete successfully". On serverless it depends on a `waitUntil` primitive; Node.js servers and Docker are supported, static export is not, adapters are platform-specific. | N4 | A guarantee of completion, retry, or durability. The page describes it for tasks such as logging and analytics, not for timers. |

### 3.2 Identity, tenant context and authorization (Supabase Auth and RLS)

| Documented fact | Source | Not stated on the page |
| --- | --- | --- |
| The Auth overview states Supabase Auth is for authenticating **and** authorizing users. | S1 | A tenant, team or workspace model. |
| JWT claims include `sub` (the user ID), `role` (`authenticated`, `anon`, `service_role`), `aal` (assurance level), `session_id`, `email`, `is_anonymous`, `amr`, `app_metadata` and `user_metadata`. | S2 | Which claims are safe to authorize on; that is covered by S3. |
| Row Level Security: `auth.uid()` returns the requesting user's ID; policies are written per operation with `using` and `with check`; the docs show wrapping the call as `(select auth.uid())`. The `service_role` has every privilege and "bypasses RLS, so keep it server-side". | S3 | A reviewer, stage or approval policy. |
| The RLS page warns that a policy relying on the `user_metadata` claim "can create security issues" because that information "can be modified by authenticated end users", and distinguishes `raw_user_meta_data` (user-updatable) from `raw_app_meta_data`. | S3 | Where reviewer assignment should live. |
| Role-based access control with custom claims is done with a **Custom Access Token Auth Hook** that runs before a token is issued and adds claims, used in RLS policies. Auth Hooks listed: Before User Created, Custom Access Token, Send SMS, Send Email (Free and Pro), MFA Verification Attempt and Password Verification Attempt (Teams and Enterprise). Errors from a Postgres hook "are not retry-able". | S4, S5 | A per-request or per-stage permission model. |
| Database functions: "Prefer `security invoker`, which is also the default"; a `security definer` function must set `search_path`. | S6 | Guidance specific to approval transitions. |

### 3.3 Persistent data, transactions and concurrency (PostgreSQL documentation)

These rows describe the PostgreSQL 18 documentation, not Supabase documentation.

| Documented fact | Source | Not stated on the page |
| --- | --- | --- |
| Read Committed is the default isolation level; a plain `SELECT` sees a snapshot as of the query start. | P1 | Behavior in the fixture's Postgres 17 (not checked). |
| Under Repeatable Read, a transaction that tries to modify a row changed by a concurrent transaction is rolled back with "could not serialize access due to concurrent update", and "applications using this level must be prepared to retry transactions". Serializable has the same retry requirement. | P1 | A retry policy; that is application logic. |
| Row-level locks (`FOR UPDATE`, `FOR NO KEY UPDATE`, `FOR SHARE`, `FOR KEY SHARE`) "block only writers and lockers to the same row"; "two transactions can never hold conflicting locks on the same row". Explicit locking "can increase the likelihood of deadlocks"; PostgreSQL detects and resolves them by aborting one transaction. | P2 | Which mechanism suits a terminal-state race. |
| Advisory locks have "application-defined meanings", the "system does not enforce their use", and may be useful where the MVCC model is an awkward fit. | P2 | Whether advisory locks are appropriate here. |

### 3.4 Queues and scheduled background work (Supabase and Next.js)

| Documented fact | Source | Not stated on the page |
| --- | --- | --- |
| Supabase Cron (the `pg_cron` module) schedules jobs "from every second to once a year"; a job can run SQL, a database function or an HTTP request such as invoking an Edge Function; jobs are stored in `cron.job` and runs in `cron.job_run_details`. The page recommends "no more than 8 Jobs run concurrently" and each job "no more than 10 minutes". | S7 | Per-request or per-record timers, escalation semantics, or retry on failure. |
| Scheduling an Edge Function combines `pg_cron` and `pg_net`; the page says "the hosted Supabase Platform supports" `pg_cron` and recommends keeping the URL and key in Vault, using the secret key, not the publishable key. | S8 | Local-stack availability. |
| PGMQ is "a lightweight message queue built on Postgres" with "exactly once" delivery within a visibility timeout, messages that stay until removed, and archiving instead of deleting. `pgmq.send` takes a `delay` in seconds before the message becomes visible; `read` takes a visibility timeout; `read_ct` records reads; `set_vt` extends a visibility timeout; `pop` gives at-most-once semantics if the consumer does not guarantee processing. | S9 | Retry limits, backoff, dead-letter handling, or a timer-accuracy guarantee. The page does not mention them. |
| `after()` (section 3.1) runs only within the route's duration. | N4 | Any durability across restarts. |

### 3.5 Notifications

| Documented fact | Source | Not stated on the page |
| --- | --- | --- |
| Without a custom SMTP server, Supabase Auth delivers email only to addresses that are members of the project's team; the page says the default service "currently" allows 2 messages per hour, has "no SLA guarantee", and is "not meant for production use". Custom SMTP is the documented alternative. | S10 | A general-purpose reminder or escalation email facility; these pages are about Auth emails. |
| A **Send Email** Auth hook exists (S4) so that Auth emails can be sent through another mechanism. | S4 | Use for non-Auth messages. |
| Realtime provides Broadcast ("custom notifications" is among its listed uses), Presence and Postgres Changes. | S11 | Offline delivery, reminders, or delivery guarantees. |
| The pages read for this dossier document no general-purpose notification service for reminders or escalations. | S1, S10, S11 | That is an absence in the pages read, not a claim that none exists. |

### 3.6 Audit and event capability

| Documented fact | Source | Not stated on the page |
| --- | --- | --- |
| Auth audit logs capture **authentication events** (sign-ups, sign-ins, password changes, token refresh and sign-out, MFA events). They are stored in external log storage and optionally in the Postgres table `auth.audit_log_entries`, which uses extra database storage. | S12 | Application or business-event auditing. A retention period. |
| PGAudit "extends Postgres's built-in logging" and can selectively track database activity by category (read, write, function, role, ddl, misc, all) at session, user, global or object level. Its output goes to the Postgres logs (viewed in the Dashboard's Logs), which can be downloaded as CSV. By default it records statements, not returned rows; `pgaudit.log_parameter` is not supported; configuration is limited to the role level. | S13 | A queryable application audit table, retention policy, or tamper-evidence. |
| The pages read document no facility for application-level audit events of a business transition, such as an approval decision. | S12, S13 | That is an absence in the pages read. |

## 4. The research requirements against the documented evidence

This maps what the pages document that is **relevant** to each requirement and what is left to another adapter or to
product policy. It selects nothing.

| Requirement | Relevant documented material | Left to be supplied or decided |
| --- | --- | --- |
| A1 Versioned state machine | A Postgres database with transactions (P1, P2); database functions with `security invoker` as the default (S6) | State and version storage, schema, migration approach: none are defined by the pages. |
| A2 Authorized transitions | RLS and `auth.uid()` (S3); server-side authorization in the Data Access Layer and in each Server Action (N1, N3); roles via a Custom Access Token hook (S4, S5) | The permission model, which claim or table is authoritative (S3 warns against `user_metadata`), and where the check runs. |
| A3 Durable timers | `pg_cron` schedules (S7, S8); `pgmq.send` with `delay` and visibility timeouts (S9); `after()` is route-bound (N4) | The scheduler adapter, timer precision, behavior across restarts and missed runs. |
| A4 Escalation | Same as A3; Auth-hook and SMTP material for email (S4, S10) | Escalation rules, recipients, reminder cadence, and the notification adapter. |
| A5 Audit events | Auth audit logs for authentication events (S12); PGAudit for database activity (S13) | Application-level audit events, visibility, retention. No page read documents these. |
| A6 Sequential stages only | None needed; this is a scope boundary | Nothing is selected. |
| A7 One terminal state under concurrency | Isolation levels and retry-on-serialization-failure (P1); row locks, deadlocks and advisory locks (P2) | The concurrency-control mechanism and conflict handling. The pages describe tools, not a design. |
| A8 No self-approval | Per-operation RLS policies (S3); the `user_metadata` warning (S3); `security invoker` default (S6) | The separation policy itself and its enforcement point. |

## 5. Unresolved product and host-binding decisions (none decided here)

Each must be decided by a future approved ADR from current official sources and the host's actual bindings. "Bears on
it" lists only relevant documentation; it is not a recommendation.

| Decision | Bears on it | Status |
| --- | --- | --- |
| Identity and tenant model | JWT claims, `auth.uid()`, RLS (S2, S3); the accepted Import Center ADR for the repository's own tenant pattern | Unresolved |
| Separation-of-duties policy | RLS policies, `user_metadata` warning (S3) | Unresolved |
| State and transition storage | Postgres transactions (P1, P2) | Unresolved |
| Concurrency control | Isolation, row locks, advisory locks, retries (P1, P2) | Unresolved |
| Cancellation policy | Interaction with A7 only; no page defines cancellation | Unresolved |
| Reviewer assignment rules | No page read documents assignment; claims and roles (S4, S5) | Unresolved |
| Timer and scheduler adapter | `pg_cron`, `pgmq` delay, `after()` (S7, S8, S9, N4) | Unresolved |
| Escalation and reminder behavior | Same as the timer decision | Unresolved |
| Notification adapter | Auth SMTP and hooks, Realtime (S4, S10, S11) | Unresolved |
| Authorization model | RLS, Data Access Layer, Custom Access Token hook (S3, N1, N3, S4) | Unresolved |
| Audit visibility and retention | Auth audit logs, PGAudit (S12, S13) | Unresolved |
| Recovery model | `pgmq` visibility timeouts and archive (S9); serialization retries (P1) | Unresolved |

Also unresolved, because the planning record leaves them open: the state and version schema, whether stages can ever be
parallel (out of the first release), the local-versus-hosted availability of each Supabase feature, and the hosting
target for background work and its duration limits.

## 6. Conflicts, inconsistencies, and repository boundary

- **Accepted repository scope prevails.** Import Center is the only implemented reference-host feature. No Approval
  Workflows task or ADR is approved. Webhook Developer Portal has accepted research evidence only.
- **The repository's own queue is not a platform primitive.** ADR 0002 uses `pgmq` for the Import Center fixture only;
  the research record calls job and audit primitives shared dependencies, not completed capabilities.
- **Docs versus fixture versions.** PostgreSQL pages describe version 18 while the fixture's local stack runs Postgres
  17; Next.js pages match the pinned 16.4.3. Re-read for the pinned versions at ADR time.
- **Hosted-platform wording.** The `pg_cron` scheduling page speaks of "the hosted Supabase Platform"; local-stack
  support is not stated on it.
- **Vendor versus upstream.** Section 3.3 is PostgreSQL upstream documentation, not vendor guidance for the host.

## 7. Sources

All retrieved 2026-10-27 as published pages opened directly.

| Id | Page | Notes |
| --- | --- | --- |
| N1 | Next.js, [How to implement authentication](https://nextjs.org/docs/app/guides/authentication) | Latest v16.4.3 |
| N2 | Next.js, [Proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) | Latest v16.4.3 |
| N3 | Next.js, [Data security](https://nextjs.org/docs/app/guides/data-security) | Latest v16.4.3 |
| N4 | Next.js, [`after`](https://nextjs.org/docs/app/api-reference/functions/after) | Latest v16.4.3 |
| S1 | Supabase, [Auth](https://supabase.com/docs/guides/auth) | no version label |
| S2 | Supabase, [JWT claims reference](https://supabase.com/docs/guides/auth/jwt-fields) | |
| S3 | Supabase, [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) | |
| S4 | Supabase, [Auth Hooks](https://supabase.com/docs/guides/auth/auth-hooks) | |
| S5 | Supabase, [Custom Claims and RBAC](https://supabase.com/docs/guides/database/postgres/custom-claims-and-role-based-access-control-rbac) | |
| S6 | Supabase, [Database functions](https://supabase.com/docs/guides/database/functions) | |
| S7 | Supabase, [Cron](https://supabase.com/docs/guides/cron) | |
| S8 | Supabase, [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) | |
| S9 | Supabase, [PGMQ extension](https://supabase.com/docs/guides/queues/pgmq) | |
| S10 | Supabase, [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) | |
| S11 | Supabase, [Realtime](https://supabase.com/docs/guides/realtime) | |
| S12 | Supabase, [Auth Audit Logs](https://supabase.com/docs/guides/auth/audit-logs) | |
| S13 | Supabase, [PGAudit](https://supabase.com/docs/guides/database/extensions/pgaudit) | |
| P1 | PostgreSQL 18, [13.2 Transaction Isolation](https://www.postgresql.org/docs/current/transaction-iso.html) | upstream database documentation |
| P2 | PostgreSQL 18, [13.3 Explicit Locking](https://www.postgresql.org/docs/current/explicit-locking.html) | upstream database documentation |

## 8. Not read; to read at ADR time (no claim here depends on them)

The PostgreSQL 17 pages for the fixture's local stack; the Supabase pages for local development to see which extensions
exist locally; Supabase Edge Function limits; the Auth sessions and MFA pages; the `pg_cron` project documentation for
missed-run behavior; web-platform notification or push specifications (browser notifications were out of this task's
source list); and any provider documentation for a notification vendor, which an ADR would only consult after choosing
one. The remaining Next.js Server Actions and forms pages were not needed for a claim here.

## 9. Source and license note

These are documentation sources whose license terms were **not reviewed** in this task. This dossier paraphrases and
quotes only short phrases, links to each publisher, and copies no documentation text into code. The research record's
source and license evidence gate is therefore not satisfied by this dossier. A license review of each source, and of
any library or service an ADR proposes, is required at the ADR stage by the appropriate human owner. This note is not
legal advice and draws no conclusion about copying, quotation, attribution or distribution. No notification or
scheduler behavior was tested, and no outbound request was made to any notification service.

## 10. Proposed next step only

A separately approved ADR and task, after the coordinator decides the items in section 5, re-reads the pages for the
pinned versions, and completes section 8. This dossier gives no effort estimate, release promise, or claim that any
capability was tested.
