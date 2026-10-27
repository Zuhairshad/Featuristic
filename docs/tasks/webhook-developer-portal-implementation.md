# Webhook Developer Portal reference host (implementation task)

- Status: **Proposed. Not approved.** This task becomes "Approved for implementation" only after the coordinator or user
  accepts [ADR 0005](../adr/0005-webhook-developer-portal.md) and approves this task, and after the preconditions below
  are met. Until then it authorizes nothing: no code, migration, outbound request, credential, dependency, or remote
  service.
- Owner: Feature author (Claude B)
- Proposed branch: `claude/webhook-portal-implementation-b`, created from the then-current `origin/feature/import-center`
  tip. The coordinator names the final branch on the assignment board. The base commit is recorded in the handoff.
- Decisions: every value in this task comes from ADR 0005, including its "Items that need explicit approval" table.
  If approval changes a value, this task is amended before work starts.

## Objective

Build a local-only, executable reference implementation of the Webhook Developer Portal in `fixtures/next-supabase`,
on top of the Import Center reference host. A tenant admin registers and disables an HTTPS endpoint, chooses events
from a fixed catalog, rotates secrets, inspects delivery attempts, and replays failures. Deliveries are signed,
retried a bounded number of times, and recorded, and an admin-action audit trail is searchable. It is a fixture
feature, not installer logic. Outbound webhooks only; no inbound webhooks and no generic event platform.

## Preconditions (all must hold before any edit)

1. PR #1 (Import Center reference host) is merged into `feature/import-center`. This task depends on its `tenants`,
   `tenant_members`, `is_tenant_admin`, local Supabase configuration, `pgmq` pattern, operator-secret endpoint
   pattern, and worker-exposure guard, none of which exist on `feature/import-center` today. If it is not merged, stop
   and report to the coordinator.
2. ADR 0005 is Accepted, and this task is changed to "Approved for implementation" by the coordinator.
3. The research records PR #11 and PR #12 are merged, or the coordinator confirms them as accepted references.
4. A Docker-compatible runtime and the fixture's local Supabase CLI are available. If not, record the exact blocked
   command and stop; do not claim database or integration results.

## Authorized paths and operations

All paths are relative to the repository root. Nothing else may be created or edited.

| Path | Authorization |
| --- | --- |
| `fixtures/next-supabase/supabase/migrations/<timestamp>_webhook_developer_portal.sql` | One new migration with a timestamp later than every existing migration. Tables, indexes, RLS, grants, functions, the emission trigger on `public.imports`, the `pgmq` queue `webhook_delivery_jobs`, and Vault use, exactly as ADR 0005 describes. |
| `fixtures/next-supabase/supabase/tests/database/webhook_developer_portal.test.sql` | pgTAP tests `D1` to `D10`. |
| `fixtures/next-supabase/src/webhook-portal/**` | Pure modules and their unit tests: `catalog.ts`, `url-policy.ts`, `forbidden-ranges.ts`, `egress-guard.ts`, `deliver.ts`, `signing.ts`, `backoff.ts`, `retry-policy.ts`, `redact.ts`, `worker.ts`, `worker-supabase.ts`, `service.ts`, each with a `*.test.ts`. |
| `fixtures/next-supabase/src/server/webhook-env.ts`, `webhook-run-worker.ts` | New server modules. `webhook-run-worker.ts` is the only place that builds a service-role client for webhooks. Do **not** edit `src/server/env.ts`. |
| `fixtures/next-supabase/app/api/internal/webhook-worker/route.ts` | Operator-authenticated worker trigger. |
| `fixtures/next-supabase/app/api/internal/webhook-retention/route.ts` | Operator-authenticated bounded purge. |
| `fixtures/next-supabase/app/webhooks/**` | UI and Server Actions: endpoint list, new endpoint, endpoint detail, delivery detail, audit history. |
| `fixtures/next-supabase/src/components/webhook-*.tsx` | UI components for the above. |
| `fixtures/next-supabase/tests/integration/webhook-portal.itest.ts`, `tests/integration/helpers/webhook-receiver.ts` | Integration tests `I1` to `I10` and a local `node:http` test receiver. |
| `fixtures/next-supabase/README.md`, `fixtures/next-supabase/.env.example` | Add a Webhook Portal section (including the delivery guarantee and a receiver verification snippet) and placeholder names only. |
| `fixtures/next-supabase/app/layout.tsx` | At most a navigation link to `/webhooks`. No other change. |
| `docs/handoffs/webhook-developer-portal.md` | Versions, commands, results, Git state, known limits, deferred work. |

| Operation | Authorization |
| --- | --- |
| Local Supabase: `supabase stop --no-backup`, `start`, `db reset --local`, `test db --local`, through the fixture's package scripts | Allowed, local stack only. |
| Running the worker route against the **local test receiver** | Allowed, only inside tests and only with the injected test egress policy. |
| Adding exact-pinned dependencies | **Not authorized.** The design uses `node:https`, `node:dns`, `node:net`, `node:crypto`, `node:http`, and the existing `vitest`. A package needs a separate approval. |
| `supabase/config.toml` change | **Not authorized** unless the implementation records why it is unavoidable and the coordinator approves first. |

## Prohibited

Remote credentials, `supabase link`, `db push`, any hosted Supabase project, deployment, automatic merge, any
scheduler or cron, a real third-party endpoint, a payment or vendor or provider selection, production credentials,
edits to Import Center source or its migration, `packages/contracts`, `apps/cli`, `features/**`, root `package.json`,
`pnpm-lock.yaml`, `pnpm-workspace.yaml`, and any feature manifest. No test or manual run may send a request to any
host outside the machine. The production egress policy must not be readable from an environment variable.

## Required behavior (externally observable)

1. A tenant admin can register an endpoint with a name, an HTTPS URL, and one or more events from the catalog
   `import.completed`, `import.failed`, `webhook.test`. Invalid URLs are refused with a safe message. The URL is
   masked in lists.
2. The admin can change subscriptions, disable and enable an endpoint, rotate the signing secret, revoke the previous
   secret, send a `webhook.test` event, view the delivery log and per-attempt detail, replay a `failed` delivery, and
   cancel a pending or retrying delivery. Tenant B, a member of tenant A, and an anonymous caller can do none of this.
3. The secret is shown once, in the creating or rotating action's response, with `Cache-Control: no-store`. It never
   appears in a URL, cookie, redirect, log, audit row, attempt row, error message, or later page.
4. Completing or failing an import emits exactly one event per (import, run, status) in the same transaction as the
   status change, with one delivery per active subscribed endpoint. A rolled-back change emits nothing.
5. The operator worker route delivers due deliveries: it signs with HMAC-SHA256 (format in ADR 0005), validates the
   destination at connect time, never follows a redirect, enforces the deadlines and caps, records one append-only
   attempt row per attempt, and schedules retries per the fixed table (at most 6 attempts). After the last failure
   the delivery is `failed` and its message archived.
6. Every request carries a stable `event_id` and `delivery_id` and an increasing attempt number, so a receiver that
   committed but timed out sees the same event identity on the retry.
7. The audit history lists the admin actions in ADR 0005 with actor, tenant, action, target, time, and outcome, is
   searchable by those fields and a date range, and never contains a URL, secret, or payload.
8. Retention: the operator purge route deletes at most 500 expired rows per call (30 days for events, deliveries,
   attempts, and the queue archive; 90 days for audit).
9. The README documents the delivery guarantee (at-least-once, unordered, receiver deduplicates by `event_id`), the
   limits of the egress guard (best effort), and that the audit trail is **not tamper-proof**.

## Verification plan

Run each command against a fresh local stack and record the exact command, exit code, and test totals. Distinguish what
you ran from anything reported by someone else.

1. `cd fixtures/next-supabase && pnpm exec supabase stop --no-backup && pnpm supabase:start && pnpm supabase:reset`
2. `pnpm supabase:test:db` (the existing Import Center tests must still pass, plus `D1` to `D10`)
3. `pnpm test` in the fixture, then `pnpm test:integration` (the existing tests plus `I1` to `I10`)
4. At the repository root: `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`,
   `pnpm inspect:fixture`, and `git diff --check origin/feature/import-center...HEAD`
5. Review the full diff for any path outside the table above and for any secret-shaped string.

No test may make a real outbound network call. Inject the clock, the resolver, the egress policy, and the failure
seam (a `SimulatedCrash` as in the Import Center). Tests reach the local receiver only through the injected test policy.
If Docker or local Supabase is unavailable, record the exact blocking command and do not claim RLS, queue, or
delivery behavior is verified. Browser behavior is not verified unless actual browser evidence exists; do not claim it.

### Test matrix (every row is required)

| Id | Layer | What it must prove |
| --- | --- | --- |
| `U1` | unit | The catalog rejects unknown event types; each event payload contains only its allow-listed fields |
| `U2` | unit | Registration checks accept a plain `https://host/path` and reject: other schemes, credentials, IP literals, `localhost`, single-label hosts, ports other than 443, hexadecimal, octal, decimal-integer, and trailing-dot forms, and over-long URLs; the host is taken from the parsed URL |
| `U3` | unit | The backoff function returns exactly 1 min, 5 min, 30 min, 2 h, 6 h and nothing after the sixth attempt |
| `U4` | unit | Status classification: `2xx` delivered; `408`, `429`, `5xx`, timeout, and network error retry; `3xx`, other `4xx`, and a blocked destination are terminal; an integer `Retry-After` is honored up to 1 hour; an HTTP-date is ignored |
| `U5` | unit | A fixed test vector for the signature string `<timestamp>.<event_id>.<raw body>`; header format with one and two `v1=` values; constant-time verification helper accepts the right signature and rejects a wrong one and a stale timestamp (more than 300 s); the secret is 32 random bytes from `crypto.randomBytes` |
| `U6` | unit | Every IANA special-purpose IPv4 and IPv6 block that is not globally reachable, and every OWASP minimum-list address, is classified forbidden; public addresses are allowed; IPv4-mapped IPv6 forms of forbidden IPv4 addresses are forbidden |
| `U7` | unit | The guard, with an injected resolver, checks every returned address and blocks if any is forbidden |
| `U8` | unit | A resolver that returns a public address first and a private address on a second call is resolved once per connection; the connection uses the validated address |
| `U9` | unit | A blocked destination causes zero calls to the injected transport |
| `U10` | unit | A receiver returning `301`, `302`, `307`, and `308` gets exactly one request and the attempt is terminal |
| `U11` | unit | A receiver that stalls headers is aborted by the 10 s deadline; a receiver that streams an endless body is destroyed after 64 KiB; an idle socket is destroyed by the 5 s timeout, using an injected clock where possible |
| `U12` | unit | Source-pattern guard: the webhook service-role client is imported only by the worker and retention routes; no Server Action, page, or tenant route references it |
| `U13` | unit | The attempt-record builder drops response body, headers, request headers, signature, raw error text, and URL path and query; audit metadata allows only its allow-listed keys |
| `U14` | unit | The worker secret is disabled when unset or shorter than 32 characters, and enabled at 32 |
| `D1` | pgTAP | RLS is enabled on every webhook table, with the expected policies |
| `D2` | pgTAP | Positive: admin A reads endpoints, deliveries, attempts, and audit of tenant A. Negative: tenant B admin, member A, and anonymous read nothing |
| `D3` | pgTAP | `anon` and `authenticated` have no insert, update, or delete on any webhook table; each admin function works for admin A and is refused for tenant B, member A, and anonymous with the same error for a missing and a foreign id |
| `D4` | pgTAP | `authenticated` and `anon` cannot read Vault or any secret value; the signing-secret, claim, record-attempt, sweep, and purge functions are executable by `service_role` only |
| `D5` | pgTAP | A status change to `completed` or `failed` creates one event and one delivery per active subscribed endpoint and none for disabled or unsubscribed endpoints; a duplicate emission is ignored; rolling the change back leaves no event (this also proves the trigger-transaction assumption) |
| `D6` | pgTAP | Claim only when `pending` or `retrying` and due; a stale or superseded attempt number is a no-op; an expired lease can be reclaimed; the sixth failure ends in `failed` and no seventh attempt can be claimed |
| `D7` | pgTAP | `UPDATE` and `DELETE` on attempt rows are refused for every role including `service_role`, and the guard trigger raises (this also proves the trigger-can-raise assumption) |
| `D8` | pgTAP | Each admin function writes exactly one audit row in its own transaction; metadata contains no URL, secret, or payload; audit rows cannot be updated or deleted |
| `D9` | pgTAP | Replay: only `failed`; links `replay_of`; same `event_id`; refused for a disabled endpoint, a purged event, a pending replay, and after 10 replays |
| `D10` | pgTAP | The purge function deletes at most 500 expired rows per call and respects the 30-day and 90-day horizons |
| `I1` | integration | Tenant B admin, member A, and anonymous cannot read tenant A's deliveries, attempts, or audit, and cannot replay or cancel; the owning admin can |
| `I2` | integration | A tenant B session token, a wrong secret, no secret, a short secret, and an unset secret all leave tenant A's delivery unchanged; only the operator secret advances it |
| `I3` | integration | **Critical:** a receiver that processes the event and then times out gets a retry with the same `X-FeatureKit-Event-Id` and `X-FeatureKit-Delivery-Id` and a higher attempt number; the first attempt is recorded as `timeout` and the retry is visible |
| `I4` | integration | A receiver that always returns `500` gets exactly 6 attempts at the scheduled times (injected clock), then `failed` and an archived message; a replay creates a linked delivery with the same event id |
| `I5` | integration | **Critical:** endpoints whose names resolve (injected resolver) to `127.0.0.1`, `169.254.169.254`, `::1`, a mapped private address, and an RFC 1918 address are `blocked_destination`, are terminal, and the receiver sees zero connections |
| `I6` | integration | A receiver redirect gets one request; a stalled receiver is cut off at the deadline; an endless response is cut off at the cap; each is recorded as an attempt |
| `I7` | integration | A `SimulatedCrash` after claim and before recording leaves an expired lease; the next worker call records one `interrupted` attempt and delivers; the sweep re-enqueues a delivery with no live message |
| `I8` | integration | A canary secret appears only in the single reveal response and in no rendered page, audit row, attempt row, error summary, or captured log; during rotation both active versions sign; a revoked version is never used |
| `I9` | integration | Disabling an endpoint stops fan-out, cancels its pending and retrying deliveries with reason `endpoint_disabled`, and refuses replay; re-enabling does not resurrect them |
| `I10` | integration | A receiver using the documented verification snippet accepts a genuine delivery and rejects a tampered body and a stale timestamp |

## Acceptance criteria

The task is complete only when every matrix row passes on a fresh local stack, the existing Import Center tests still
pass, the workspace checks pass, the diff contains only authorized paths, the README states the delivery guarantee and
the best-effort and not-tamper-proof limits, and the handoff records exact commands, results, versions, and anything
not run. Any failed assumption listed in ADR 0005 stops the task and returns to the coordinator; do not weaken a test.

## Stop conditions

Stop and report, without working around it, if: PR #1 is not merged; `supabase_vault` is unavailable locally; a trigger
cannot run in the triggering transaction or cannot raise; `pgmq.send` cannot delay and no equivalent exists; `https.request`
does not honor a custom `lookup` for the connection; a dependency would be needed; or a change to an Import Center file
would be required.

## Deferred work

Autonomous scheduling and production deployment, a hosted Supabase project, installer templates and a feature manifest,
inbound webhooks, a generic event platform, per-tenant egress policy, member-facing delivery views, auto-disable,
signing inside Postgres, RFC 9421 signatures, and a license review of any library or vendor an implementation might add.
