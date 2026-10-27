# ADR 0005: Webhook Developer Portal reference-host implementation (proposed)

- Status: **Proposed.** Not accepted. No code, migration, outbound delivery, credential, dependency, or remote service
  is authorized by this ADR. Acceptance needs the coordinator or user, and implementation needs the separate task
  [`docs/tasks/webhook-developer-portal-implementation.md`](../tasks/webhook-developer-portal-implementation.md)
  to be approved as well.
- Date: 2026-10-27
- Owner: Claude B (Feature 2)
- Task: [`docs/tasks/webhook-developer-portal-adr.md`](../tasks/webhook-developer-portal-adr.md)
- Related: ADR 0002 and ADR 0004 (Import Center reference host), which this ADR reuses for tenancy, local Supabase, and
  the queue pattern, and which ADR 0002 names as the gate that webhook delivery must pass ("require a separate approved
  task and ADR").

## Context

The research record names Webhook Developer Portal as the second candidate: a tenant admin registers an endpoint,
chooses events from a fixed catalog, rotates secrets, inspects delivery attempts, and replays failures. The bounded
first release is **outbound webhooks only**, a **fixed event catalog**, and **documented ordering guarantees**. The
research package requires signed deliveries, bounded retries, endpoint validation, delivery accounting, payload
redaction, forbidden-destination blocking, and a stable event identity after a receiver commits but times out.

The accepted research records leave every decision below open. They are used here as the evidence base and are cited
as plain-text references, not links, because they live on unmerged branches:

| Short id | Record | Accepted head |
| --- | --- | --- |
| `P` | Planning source `docs/roadmap/webhook-developer-portal-source.md` (on `feature/import-center`) | canonical |
| `D:` | Source dossier `docs/evidence/webhook-developer-portal-source-dossier.md` (PR #11), ids `N1`-`N4`, `S1`-`S9`, `G1`-`G5` | `20ff1d9` |
| `T:` | Transport note `docs/evidence/webhook-developer-portal-transport-research.md` (PR #12), ids `F1.1`-`F6.4`, `U1`-`U8` | `99bba22` |
| `R` | Final review `docs/handoffs/webhook-developer-portal-research-final-review.md` (on `feature/import-center`) | canonical |

The final review accepts #11 and #12 as research only and requires an ADR that re-reads sources "against the supported
host's actual bindings and pinned versions". This ADR does that where a decision depends on a version-sensitive claim
(section "Sources re-read for this ADR").

**Prerequisite that this ADR cannot satisfy.** The tenant model (`tenants`, `tenant_members`, `is_tenant_admin`), the
local Supabase configuration, the `pgmq` queue pattern, the operator-secret worker endpoint, and the worker-exposure
guard all live in the Import Center reference host, which is on PR #1 and **not yet on `feature/import-center`**. This
ADR therefore proposes a design that builds on that host and treats "PR #1 merged" as a hard precondition of the
implementation task. If PR #1 does not merge, the tenancy and queue decisions below must be re-opened.

## Decision summary

| # | Decision | Proposed recommendation (one line) |
| --- | --- | --- |
| D1 | Tenant, admin authority, ownership | Reuse the Import Center tenant model; tenant-owned endpoints; all actions admin-only; writes only through `SECURITY DEFINER` functions; no service role from a tenant request |
| D2 | Event intent, identity, accounting | Outbox rows written in the same transaction as the business change; fan-out at emit time; stable `event_id` and `delivery_id`; append-only attempt records; at-least-once, unordered |
| D3 | Secrets, signing, redaction | Per-endpoint secret versions in Supabase Vault; HMAC-SHA256 signature over timestamp, event id, and raw body; show once; overlap rotation; allow-listed payloads; no response bodies stored |
| D4 | SSRF and egress | HTTPS and port 443 only, DNS names only; connect-time resolution of every address with a single validated lookup per connection; no redirects; hard deadlines and body caps; every attempt re-validated |
| D5 | Retry, replay, worker | Six attempts on a fixed schedule; lease and attempt-number guards; `pgmq` queue with an operator-authenticated worker; replay creates a linked delivery |
| D6 | Retention, audit, tests | 30-day delivery retention and 90-day audit retention (proposed numbers); append-only audit of admin actions; local Supabase only; a named negative and integration test matrix |

The proposed numbers (ports, attempt counts, delays, deadlines, retention) are listed again in "Items that need
explicit approval". Each is a v1 constant in one module, so changing one later is an ADR amendment.

## D1. Tenant and admin authority, RLS boundary, endpoint ownership

### Recommendation

1. **Authority comes from `auth.uid()` and `tenant_members`**, through the existing `public.is_tenant_admin(tenant_id)`.
   A client-supplied tenant id or role is never authorization. Every webhook table has a `tenant_id` and row level
   security enabled (D:S2: RLS is default-deny with no policy; `auth.uid()` is `null` without a user).
2. **Endpoints belong to the tenant**, not to a user. `created_by` is recorded for audit only, so an endpoint survives
   its creator leaving.
3. **All webhook actions are tenant-admin only** in v1: register, change subscriptions, disable and enable, rotate and
   revoke a secret, view deliveries and attempts, replay, and cancel. Members have no access, matching the Import
   Center decision. There is no separate "reviewer" role in v1: replay and cancel need the same admin authority as
   registration.
4. **Table privileges for `anon` and `authenticated` are `SELECT` only**, with admin-only select policies. All writes
   go through `SECURITY DEFINER` functions with `set search_path = ''` that re-check admin membership, raise one error
   for "missing" and "someone else's", and write their audit row in the same transaction (D:S2 on `security definer`
   and `search_path`).
5. **The service-role client is used only by the operator-authenticated worker route.** No Server Action, page, or
   tenant-facing route may import it. A source-pattern guard test (as in the Import Center) enforces this, and an
   integration test proves that a tenant admin's session cannot make another tenant's delivery progress (D:N4 on
   treating Server Actions as directly reachable POST endpoints).
6. **Server identity for sensitive actions** (rotate, revoke, replay, cancel) is confirmed with `getUser()`, as the
   Import Center session code does, in addition to the database check. The Supabase guidance says `getClaims()`
   suffices for page protection but that "an unexpired token stays valid even when the session behind it was
   revoked", so a server-confirmed user is the safer check for actions that are costly to undo.

### Rejected alternatives

- **Per-user endpoint ownership.** An endpoint would be orphaned or silently stop being manageable when its creator
  leaves, and the research outcome is a tenant-level feature.
- **Member read access to the delivery log.** Attempt metadata can reveal receiver URLs and failure patterns. The Import
  Center made its data admin-only and this ADR keeps one rule. A member-facing view would be its own decision.
- **Trusting a client-supplied tenant id or an app-layer role check as authorization.** Rejected by ADR 0002 and by
  `AGENTS.md`: the database must decide.
- **Using the service role to perform tenant actions "on behalf of" the user.** It bypasses RLS (D:S2) and would turn
  every route bug into a cross-tenant write.

### Residual risk

Admin authority is all-or-nothing in v1. A compromised admin account can register an endpoint, rotate a secret, and
replay. The audit trail (D6) and the egress controls (D4) bound, but do not remove, that risk.

## D2. Transactional event intent, stable event identity, durable accounting

### Recommendation

1. **Fixed v1 event catalog** of exactly three types: `import.completed`, `import.failed`, and `webhook.test`. The first
   two are the only domain events that exist in the reference host (they come from the Import Center); `webhook.test`
   lets an admin exercise an endpoint. The catalog is a constant and a database check; adding an event is an ADR
   amendment.
2. **Outbox in the same transaction.** An `AFTER UPDATE` trigger on `public.imports`, created by a **new migration**
   (no edit to Import Center code), writes the event and its delivery rows when `status` changes to `completed` or
   `failed`. A rolled-back business change therefore emits nothing, and a committed one always does (research:
   "transactional event intent"; D:S3 documents that `pg_net` starts requests only after the transaction commits, and
   D:S4 documents that Database Webhooks state no delivery guarantee). *Assumption to verify:* the Supabase trigger page does not say a trigger runs in the
   triggering statement's transaction, so a pgTAP test must roll back a status change and assert that no event row
   remains.
3. **Fan-out at emit time.** One event row per event, and one delivery row per currently active, subscribed endpoint,
   all in that transaction. A later subscription change does not alter an already emitted event.
4. **Idempotent emission.** `webhook_events` has `unique (tenant_id, dedupe_key)` and is written with
   `INSERT ... ON CONFLICT DO NOTHING`. The PostgreSQL INSERT documentation (read 2026-10-27, see "Sources re-read")
   says `ON CONFLICT DO NOTHING` "simply avoids inserting a row as its alternative action" and that unique indexes
   are supported as arbiters; it makes no atomicity statement for `DO NOTHING`, so the duplicate-emit test (`D5`) is
   what proves the behavior. For import events the key is `import:<import_id>:<run_id>:<status>`, so a replayed
   import emits once per run and status.
5. **Stable receiver-visible identity.** `event_id` is a UUID created with the event row and never changes. A
   `delivery_id` is per (event, endpoint) and is stable across retries; a replay gets a new `delivery_id` and the **same
   `event_id`**. Each request carries the attempt number. This is the identity that survives "the receiver committed
   but timed out" (research critical verification).
6. **Durable accounting.** Tables: `webhook_endpoints`, `webhook_endpoint_subscriptions`, `webhook_secret_versions`,
   `webhook_events`, `webhook_deliveries` (state machine below), `webhook_delivery_attempts` (one row per attempt),
   and `webhook_audit_events` (D6). Delivery states: `pending`, `in_progress`, `retrying`, `delivered`, `failed`,
   `canceled`. Attempt outcomes: `success`, `http_error`, `timeout`, `network_error`, `blocked_destination`,
   `interrupted`. Attempt rows are append-only: `UPDATE` and `DELETE` are revoked from every API role including
   `service_role`, and a trigger that raises on update or delete is added as defense in depth (*assumption:* the
   Supabase trigger page does not say a trigger can raise, so a pgTAP test must prove it).
7. **Receiver payload.** A JSON body `{ "id": event_id, "type", "created_at", "data" }` where `data` is an explicit
   allow-list per event type. For `import.*`: `import_id`, `status`, `total_rows`, `imported_count`,
   `duplicate_count`, `invalid_count`, `completed_at`. Never row data, file names, storage paths, or tenant secrets.
8. **Documented delivery guarantee: at-least-once, unordered.** A receiver may see the same `event_id` more than once
   (for example after a timeout) and must deduplicate on it; events may arrive out of order and each carries
   `created_at`. This statement is part of the README the implementation produces.

### Rejected alternatives

- **Database Webhooks or `pg_net` as the delivery mechanism.** The docs state no retries or ordering (D:S4), keep responses
  in an UNLOGGED table for 6 hours that is not preserved after a crash (D:S3), expose no destination control, and the
  secret key is saved in the trigger definition (D:S4). That fails the accounting and egress requirements.
- **Emitting the event from application code after commit.** A crash between commit and emit loses the event, which the
  research's transactional-intent requirement forbids.
- **Fan-out in the worker.** A subscription change would race with in-flight events and make "which endpoints should
  have received this" unanswerable. Fan-out at emit time makes that a fact.
- **Per-endpoint ordering (FIFO) and exactly-once delivery.** FIFO needs single-flight per endpoint and head-of-line
  blocking across retries and replays. Exactly-once is not achievable across a receiver that can commit and time out;
  `pgmq` itself documents "exactly once" only within a visibility timeout (D:S7). Both are rejected for v1.
- **Editing the Import Center functions to emit events.** It would change Feature 1 behavior. The trigger is additive.

### Residual risk

The trigger couples the webhook migration to the `public.imports` schema. If PR #1's schema changes before merge, the
trigger must change with it.

## D3. Secret storage, signing, rotation, reveal, redaction

### Recommendation

1. **Storage.** Each endpoint secret version is stored with `vault.create_secret()` in Supabase Vault, which keeps
   secrets "encrypted and authenticated" on disk with the key outside the database (D:S5). `webhook_secret_versions`
   holds only the Vault secret id, the version number, a status (`active`, `previous`, `revoked`), and timestamps.
   Tenant sessions can never select from Vault or from a secret column. A `SECURITY DEFINER` function that reads
   `vault.decrypted_secrets` is executable by `service_role` only, because "anyone that has access to the view has
   access to decrypted secrets" (D:S5). *Assumption to verify:* the `supabase_vault` extension is available in the pinned
   local stack; if it is not, this decision is re-opened and the task stops.
2. **Algorithm and format.** HMAC-SHA256 computed in Node with `crypto.createHmac` (D:G4). Headers sent with every
   delivery: `Content-Type: application/json`, `X-FeatureKit-Event-Id`, `X-FeatureKit-Event-Type`,
   `X-FeatureKit-Delivery-Id`, `X-FeatureKit-Attempt`, `X-FeatureKit-Timestamp` (Unix seconds), and
   `X-FeatureKit-Signature: v1=<hex>[,v1=<hex>]`. The signed string is `<timestamp>.<event_id>.<raw body>` and the
   same bytes are sent as the body. During overlap the header carries one `v1=` value per active secret version.
   Receivers verify with a constant-time comparison and reject a timestamp more than 300 seconds old. A published
   verification snippet and test vector are part of the README.
3. **Secret generation and reveal.** The secret is generated in Node with `crypto.randomBytes(32)` (listed on the
   Node.js `crypto` page; its section was not read for this ADR, so `U5` includes a length and randomness-source
   check), stored through the
   admin function, and **shown once** in the response of the creating or rotating action. It is never placed in a
   URL, cookie, redirect, log, audit row, or error message, and the response is `Cache-Control: no-store`. It cannot be
   shown again. Losing it means rotating.
4. **Rotation.** Rotation creates a new version and keeps the old one as `previous` for a 24-hour overlap, then the
   worker's sweep marks it `revoked`. An admin may revoke a previous version immediately. Revoked versions are never
   used to sign.
5. **Secret handling in the worker.** The signing secret is fetched per attempt through the service-role-only function,
   held in memory only for that attempt, and never logged. Error handling stores a fixed outcome enum, not a thrown
   message.
6. **Redaction rules.** Attempt records store: status code, outcome enum, duration, attempt number, and timestamps.
   They do **not** store the response body, response headers, request headers, the signature, the raw network error
   text, or the endpoint URL path and query. The UI shows event type, ids, header *names*, status and timing, and the
   allow-listed payload. The endpoint URL is treated as sensitive (receiver URLs often embed tokens): it is visible to
   admins, masked in lists, and excluded from audit rows, logs, and error summaries (audit keeps host only).

### Rejected alternatives

- **Plain-text or reversible-in-app secrets in an ordinary column.** Anyone with table access, a backup, or a dump gets
  every receiver's signing key.
- **Hashing the secret like a password.** HMAC needs the key itself; a hash cannot sign.
- **A key held in an environment variable for application-layer encryption.** It adds key management the host
  already provides through Vault, and Next.js documents environment variables only as server-only values, not as a
  secrets manager (D:N3).
- **An external secret manager or KMS.** Selecting a vendor is not authorized by this ADR or by the research.
- **Computing the HMAC inside Postgres so the secret never leaves the database.** Attractive, but the exact byte
  agreement between a SQL-built body and the bytes Node sends, and the behavior of the SQL HMAC function, were not
  verified in any source read. It is recorded as a later hardening option, not a v1 requirement.
- **RFC 9421 HTTP Message Signatures.** A standard exists (T:F6.3), but it needs component canonicalization and
  structured fields. A single documented HMAC format is simpler to verify and to test; migrating later is possible.
- **Reveal on demand.** It widens exposure and needs its own authorization rules.
- **Instant rotation with no overlap.** It would break receivers while events are in flight.
- **Storing response bodies for debugging.** Receivers may echo secrets or personal data, and the sources read give
  no redaction facility (T mapping row "Payload redaction").

### Residual risk

The secret exists in Node memory during an attempt, and Vault's decrypted view is reachable by anyone with its
privileges (D:S5). The mitigations are narrow function access, no logging, and short lifetime, not elimination.

## D4. SSRF and egress control

This is the decision the transport research found least protected by the platform: no source read gives automatic
protection against private, loopback, or link-local destinations, redirects are not re-validated by address, and no
end-to-end deadline or response cap is documented (T:F5.1-F5.4, F2.2, F3.4, F4.1).

### Recommendation

1. **Registration checks are for usability, not security.** Parse with `new URL()` (T:F1.1). Reject any URL that is not
   `https:`, that has credentials (T:F1.2), whose host is an IP literal, `localhost`, or a single-label name, or whose
   port is not 443. Normalize the host from the parsed URL, never from the input string, because the URL Standard
   accepts hexadecimal and octal parts that `net.isIP` rejects (T:F1.3, F1.4). These checks run again on every update.
2. **Enforcement happens at connect time, on every attempt.** Delivery uses `node:https` `request` with a custom
   `lookup`. Node documents that `https.request()` accepts all `http.request()` options and that `lookup` is a
   "Custom lookup function" defaulting to `dns.lookup()`, and the TLS server name defaults to the host name (N:http,
   N:https). The custom `lookup` resolves with `dns.lookup(host, { all: true })`, tests **every** returned address
   against the forbidden set, and fails the attempt if **any** is forbidden (OWASP: "Retrieve all the IP addresses
   behind the domain name" and check each one, D:G5). It returns the validated address to the connection, so there is
   exactly one resolution per connection and a second, unchecked lookup cannot be substituted. This matches OWASP's
   rebinding mitigation ("connects to the validated IP while preserving the original hostname"), and keeps SNI and
   certificate verification on the host name.
3. **Forbidden set.** The union of the IANA special-purpose IPv4 and IPv6 registries' non-globally-reachable blocks and
   the OWASP minimum list (loopback `127.0.0.0/8` and `::1/128`, RFC 1918, `fc00::/7`, `fe80::/10`, multicast, the
   cloud metadata address `169.254.169.254`, and the named metadata hosts). It is applied with `net.BlockList`, whose
   documented `check` example shows IPv4-mapped IPv6 forms matching an IPv4 rule (D:G3). The IANA registries could not be opened while writing
   this ADR; the implementation task must read and transcribe them, and a test fails if any registry block is missing.
4. **No redirects, ever.** A 3xx response is a terminal, non-retryable failed attempt recorded with its status code.
   `http.request()` does not follow redirects automatically (T:F3.4), so nothing needs to be disabled, but a test
   asserts that no second request is made.
5. **Retries use the same guard.** Each attempt resolves and validates again (OWASP: "Apply the destination policy to
   retries and fallback connections as well").
6. **Deadlines and caps.** A 10-second deadline for the whole attempt using `AbortSignal.timeout` passed as the
   request `signal` (the transport note records that the `http` page says an aborted request behaves like
   `.destroy()`, T:F2.2), plus a 5-second socket
   `timeout` that destroys the request itself, because the documented `timeout` option "will not abort the request or
   do anything besides add a `'timeout'` event" (T:F2.2). The response body is never buffered or stored: at most
   64 KiB is read and discarded, then the connection is destroyed. The request body is capped at 64 KiB by
   construction of the catalog.
7. **No proxy.** The worker does not enable Node's built-in proxy support. That feature is documented as added in
   v24.5.0 and v22.21.0 with stability "1.1 - Active development", so it does not exist across the supported range
   (T:F5.5). The worker asserts that proxy environment variables are unset.
8. **Test seam, not a switch.** The production policy is not configurable from the environment. Tests inject a policy
   object (resolver and forbidden-set) in code, so a local test receiver can be reached without a production bypass.

### Rejected alternatives

- **Checking the input string or only checking at registration.** Encoding forms (T:F1.3) and DNS changes after
  registration defeat it.
- **A deny-list alone.** OWASP: "Deny-lists are bypass-prone. Prefer allow-lists." An allow-list of receiver
  addresses is not possible for arbitrary tenant URLs, so the guard is deny-list plus HTTPS-only, port, host-type, and
  connect-time validation, and it is documented as best effort, "not an impenetrable wall".
- **Following redirects with re-validation.** It multiplies the guard's surface (and the Fetch standard re-checks origins
  and credentials but not resolved addresses, T:F3.4) for no research requirement.
- **Resolving once at registration and storing the address.** Receivers legitimately change addresses, and a stored
  address goes stale.
- **A per-tenant egress allow-list in v1.** It needs its own policy and admin interface.
- **Global `fetch` (undici) for delivery.** The Node pages do not describe undici's redirect, bad-port, or
  address-pinning behavior (T not-verified list), and a custom connect hook would probably need the `undici` package,
  a new dependency this ADR does not authorize.
- **`pg_net` or an Edge Function for delivery.** No destination control is documented (D:S3), and Edge duration limits
  are capped (D:S9).
- **An infrastructure firewall as the only control.** It is outside this repository and cannot be tested here. It is
  recorded in the README as recommended defense in depth for any real deployment.

### Residual risk

Best-effort guard: a forbidden-set gap, an implementation bug, or a platform behavior not described by the pages read
could permit an internal request. The negative tests below are the main control, and a deployment should add network
egress controls.

## D5. Retry, backoff, idempotency, ordering, cancel and replay, worker placement, recovery

### Recommendation

1. **Worker placement.** A `pgmq` queue `webhook_delivery_jobs` and an operator-authenticated route
   `POST /api/internal/webhook-worker`, reusing the Import Center pattern: a bearer secret compared in constant time,
   disabled unless the secret is at least 32 characters (ADR 0004), a bound of **5** messages per call processed
   sequentially, and the only importer of the service-role client. Nothing schedules it, so the feature claims no
   autonomous production delivery.
2. **Retry schedule.** At most **6 attempts**: the first immediately, then after 1 minute, 5 minutes, 30 minutes,
   2 hours, and 6 hours. The delay table is a pure function with no jitter, so it is testable. After the last failure
   the delivery becomes `failed` and its message is archived.
3. **What is retried.** Retried: network errors, timeouts, `408`, `429`, and `5xx`. Terminal and not retried: `2xx`
   (delivered), `3xx`, other `4xx`, and `blocked_destination`. For `429` and `503` an integer `Retry-After` in seconds
   is honored up to a 1-hour cap; an HTTP-date form is ignored in v1.
4. **Claim and lease.** The worker claims a delivery by one atomic update that sets `in_progress`, increments the
   attempt number, and sets `lease_until = now() + 60 seconds` only if the row is `pending` or `retrying` and due. It
   records the attempt and the next state in one database function guarded by the expected attempt number, so a
   stale or superseded call is a no-op (the same run and cursor guard idea as the Import Center).
5. **Crash recovery.** If a worker dies after a receiver answered, the lease expires and the delivery is claimed again,
   so delivery is at-least-once. The expired attempt is recorded as `interrupted` so accounting shows it. Each worker
   call first runs a bounded sweep (at most 100 rows) that re-enqueues deliveries with an expired lease or a due retry
   and no live message, so no delivery is stranded.
6. **Idempotency.** Emission is idempotent by `dedupe_key` (D2). Delivery is idempotent for the receiver by `event_id`.
   The ADR promises no more.
7. **Ordering.** None guaranteed and documented as such (D2). The worker processes one message at a time with no
   per-endpoint serialization.
8. **Replay.** Admin only, and only for `failed` deliveries. Replay creates a **new** `webhook_deliveries` row linked
   by `replay_of`, with the same `event_id`, a fresh attempt series, and the endpoint's **current** URL and active
   secret. It is refused for a disabled endpoint, for a purged event, when a replay of the same delivery is already
   pending, and after 10 replays of the same original delivery. Every replay is audited.
9. **Cancel and disable.** An admin may cancel a `pending` or `retrying` delivery. Disabling an endpoint stops new
   fan-out and makes the worker mark that endpoint's pending and retrying deliveries `canceled` with reason
   `endpoint_disabled`. Re-enabling does not resurrect them.

### Rejected alternatives

- **`after()` or Edge `waitUntil` as the delivery path.** Their work is bounded by platform duration limits and
  neither documents any delivery or retry guarantee (D:N2, D:S9).
- **`pg_cron` or an in-process timer as an autonomous scheduler in v1.** ADR 0002 defers scheduling; both are
  documented options for a later production ADR (D:S8), and the retention and sweep steps stay operator-triggered
  until then.
- **Using only the `pgmq` visibility timeout as the retry clock.** It is documented as a hide-and-redeliver
  mechanism with a read count and archive, and the page does not mention a retry limit, backoff, or dead-letter
  handling (D:S7), so the
  schedule lives in `next_attempt_at` in the database and the queue only carries wake-ups.
- **Unbounded or jittered retries.** The research requires bounded retries, and jitter makes tests non-deterministic.
- **Following the receiver's `Retry-After` without a cap.** A receiver could park a delivery indefinitely.
- **Replaying to the endpoint URL frozen at emit time.** A receiver that moved would be unreachable; replay uses current
  configuration and says so.
- **Auto-disabling an endpoint after repeated failures.** It changes tenant configuration without an admin action; v1
  only shows failures.

### Residual risk

A receiver that is down for longer than the roughly 8.6-hour retry window loses automatic delivery and depends on an
admin replay. That window is a proposal (see "Items that need explicit approval").

## D6. Retention, audit visibility, local Supabase provisioning, and tests

### Recommendation

1. **Retention (proposed numbers).** Events, deliveries, and attempts are kept 30 days after their last activity;
   audit events are kept 90 days. A bounded, operator-triggered purge route
   `POST /api/internal/webhook-retention` deletes at most 500 expired rows per call. The `pgmq` archive follows the
   30-day horizon. Nothing purges automatically.
2. **Audit trail.** `webhook_audit_events` records endpoint created, updated, enabled, disabled, subscriptions changed,
   secret rotated and revoked, delivery replayed, and delivery canceled, with actor, tenant, action, target, time,
   and outcome (`success` or `failed`). `metadata` holds only allow-listed keys (event types added or removed, secret
   version number, replay number). It never holds a URL, a secret, or a payload. The row is written by the same
   function and in the same transaction as the action, so an action and its audit row commit together.
3. **What the audit trail does not do.** A denied attempt raises an exception and rolls back, so a denial leaves no
   audit row in v1. The trail is append-only by privilege and trigger, but the table owner and the service role can
   still alter the database, so it is **not tamper-proof and the ADR does not claim it is**.
4. **Admin visibility.** A tenant admin sees a searchable history: filters by action, actor, target id, outcome, and a
   date range, plus the delivery log and per-attempt detail. This is filter-based search, not full-text.
5. **Local Supabase provisioning.** Only the local stack from the Import Center host, with one new timestamped
   migration (after `20261027000000`), one pgTAP file, and no change to `config.toml` unless the implementation
   proves it needs one. No `supabase link`, `db push`, remote command, or credential. Extensions: `pgmq` (already used)
   and `supabase_vault`. `pg_cron` and `pg_net` are not used.
6. **No new dependencies.** Delivery uses `node:https`, `node:dns`, `node:net`, and `node:crypto`; tests use
   `node:http` for a local receiver and the existing `vitest`. Any package needs a separate approval.
7. **Test matrix.** The implementation task names the exact negative and integration tests (ids `U*` for unit, `D*`
   for database, `I*` for integration). They include the research's two critical verifications (a receiver that
   commits but times out shows a visible retry with the same `event_id`; forbidden destinations make zero
   connections), tenant isolation and replay authorization, secret non-disclosure, retry limits, and crash recovery.

### Rejected alternatives

- **Indefinite retention.** Delivery records accumulate unbounded personal and operational metadata, and the research
  asks for a defined retention.
- **Automatic purge.** It needs a scheduler that ADR 0002 defers.
- **Recording denied attempts in the same transaction.** Not possible with a rolled-back exception; recording them
  elsewhere would require a second privileged write path from tenant requests.
- **Claiming a tamper-proof audit log.** Nothing in the proposed storage provides it.
- **Using `pgAudit` as the admin audit trail.** The Supabase pgAudit page (read 2026-10-27, see "Sources re-read")
  describes a database logging feature with volume, performance, and sensitive-value caveats and does not address
  retention, so it is not a queryable admin history.

## Security controls and the test that proves each

| Control | Enforced at | Proving test (see the task) |
| --- | --- | --- |
| Admin-only access, no cross-tenant read or write | RLS and `SECURITY DEFINER` functions | `D1`-`D4`, `I1` |
| Service role unreachable from tenant requests | Route and import structure | `U12`, `I2` |
| Secrets never exposed | Vault, narrow function, no logging | `I8` (canary-secret scan) |
| Signature format | Pure signing module | `U5`, `I10` |
| Destination validation and forbidden ranges | Registration checks and connect-time guard | `U2`, `U6`-`U9`, `I5` |
| No redirects, bounded time and size | Delivery module | `U10`, `U11`, `I6` |
| Bounded retries | Pure schedule and attempt guard | `U3`, `U4`, `I4` |
| Stable identity after timeout | `event_id` constant across attempts | `I3` |
| Append-only attempts and audit | Grants and trigger | `D7`, `D8` |
| Crash recovery | Lease and sweep | `I7` |

## Not authorized by this ADR

Code, migrations, outbound requests, credentials, dependencies, a hosted Supabase project, a scheduler, a payment or
vendor selection, a feature manifest, an installer template, changes to `packages/contracts`, `apps/cli`, or the
Import Center code, and any real third-party endpoint. Acceptance of this ADR is not approval of the implementation
task.

## Assumptions to verify at implementation

Each must be confirmed by a test or a re-read of current documentation, and a failure stops the task and returns to the
coordinator.

1. The `supabase_vault` extension is available in the pinned local Supabase stack.
2. A trigger on `public.imports` runs in the updating transaction and can raise an exception (the Supabase trigger page
   states neither).
3. `pgmq.send` accepts a delay (or an equivalent re-enqueue with a visibility delay) in the pinned local stack; the
   `pgmq` page read does not document a send delay.
4. `lookup` passed to `https.request` is honored for the connection and the TLS server name remains the host name
   (Node documents that `https.request` accepts all `http.request` options, that `lookup` is such an option, and that
   the SNI name defaults to the host name; the connection behavior is to be tested).
5. The "Added in" version of each cited Node API is within the supported range (`>=22.12.0`); the transport note
   re-checked most but not the per-option additions for `signal`, `timeout`, and `lookup`.
6. The IANA special-purpose IPv4 and IPv6 registries and the Fetch and URL standards' IPv6 handling, which could not
   be opened here, are read and the forbidden set is derived from them.
7. The pinned Next.js (`16.4.3`) and `@supabase/supabase-js` (`2.118.0`) behavior matches the pages read from
   publisher repository branches.

## Items that need explicit approval

| Item | Proposed value |
| --- | --- |
| Event catalog | `import.completed`, `import.failed`, `webhook.test` |
| Receiver port and scheme | HTTPS, port 443 only; no IP-literal hosts |
| Attempts and delays | 6 attempts; 1 min, 5 min, 30 min, 2 h, 6 h; no jitter |
| Attempt deadline and caps | 10 s whole attempt, 5 s socket timeout, 64 KiB read cap, 64 KiB request cap |
| Signature format | HMAC-SHA256, `v1=` hex, `X-FeatureKit-*` headers, 300 s timestamp tolerance |
| Rotation overlap | 24 hours; immediate revoke allowed |
| Replay limits | `failed` only; one pending replay; 10 replays per original |
| Retention | 30 days for events, deliveries, attempts, archive; 90 days for audit |
| Worker bound | 5 messages per call; secret at least 32 characters |
| Secret store | Supabase Vault (no new vendor) |
| Order of work | PR #1 merged first; PR #11 and #12 merged or explicitly accepted as references |

## Consequences

- The reference host gains a second feature with its own migration, worker route, and UI, built on the Import Center's
  tenancy and queue patterns, so Feature 1 must land first.
- The delivery guarantee (at-least-once, unordered, receiver deduplicates by event id) becomes a documented contract.
- The egress guard is best effort and testable, and a real deployment needs network-level egress controls in addition.
- No installer template, manifest, or contract change is created. Extracting installer templates remains a later task,
  as ADR 0002 says.

## Sources re-read for this ADR

All read on 2026-10-27. The research records above were used as accepted. Where a decision depends on a
version-sensitive claim, the current Node.js documentation was opened directly on `nodejs.org`:

- `N:http`: Node.js `http` page, `http.request()` options `lookup` ("Custom lookup function. Default:
  `dns.lookup()`"), `agent`, `signal`, `timeout`, `family`, `hints`.
- `N:https`: Node.js `https` page, "Accepts all `options` from `http.request()`", plus `rejectUnauthorized`, `servername`,
  and the `https.Agent` `servername` default (the host name unless the target is an IP address).
- `N:tls`: Node.js `tls` page, `rejectUnauthorized` default `true`, and `servername` as the SNI name.
- `net` and `crypto` as cited in the transport and dossier records.
- PostgreSQL INSERT documentation (`postgres/postgres` `master` `doc/src/sgml/ref/insert.sgml`) and the Supabase pgAudit
  page (`supabase/supabase` `master` `.../guides/database/extensions/pgaudit.mdx`), both read as publisher documentation
  source on 2026-10-27 in a separate research task, and used here only for the two statements cited above.
- Limits: `nextjs.org`, `supabase.com`, `www.postgresql.org`, the IETF and IANA hosts did not resolve from the
  authoring environment, so the Next.js, Supabase, and PostgreSQL facts cited by short id rest on the accepted
  research records, which read publisher documentation source from public repositories. The "Added in" version of the
  `http.request` `lookup` option was not shown by the page and is an assumption above. No runtime behavior, local
  Supabase stack, receiver, or CI check was executed, and no community source or real endpoint was used. Documentation
  license terms are unreviewed and the human legal-review gate remains open.
