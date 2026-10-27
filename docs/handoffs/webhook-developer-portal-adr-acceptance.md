# Webhook Developer Portal ADR acceptance

- Decision date: 2026-10-27
- ADR: [ADR 0005](../adr/0005-webhook-developer-portal.md)
- Implementation task: [Webhook Developer Portal reference host](../tasks/webhook-developer-portal-implementation.md)
- Verdict: **Accepted for local-only reference-host implementation**

## Authority and scope

The user directed FeatureKit to proceed with Claude B as the sole active worker and authorized merging tested work.
This acceptance applies the ADR's proposed v1 defaults only to `fixtures/next-supabase` and only to the implementation
task's explicit paths. It does not approve a hosted Supabase project, real receiver, production credential, deployment,
new dependency, automatic merge, or an installer feature package.

## Accepted v1 decisions

- Reuse Import Center's tenant/admin model, local Supabase configuration, `pgmq` pattern, and operator-worker guard.
- Use the fixed three-event catalog, transactionally emitted outbox rows, stable event and delivery identities,
  at-least-once unordered delivery, append-only attempts, and admin-only actions.
- Use Vault-backed secret versions, HMAC-SHA256, show-once secrets, a 24-hour rotation overlap, and the stated
  redaction rules.
- Enforce the documented HTTPS/DNS-only, port-443, no-redirect, address-validation, deadline, and response-cap
  limits in the local reference host; describe this as best effort, not complete SSRF elimination.
- Use six bounded attempts, lease/attempt guards, replay and cancel rules, a local operator worker route, 30-day
  delivery retention, and 90-day audit retention.

## Preconditions and verification gates

Feature 1 was merged into `feature/import-center` at `104aa75`, satisfying the task's Import Center prerequisite.
Claude B must obey every task stop condition and run its complete local test matrix on a fresh local Supabase stack.
Any failed assumption, unauthorized path, dependency need, remote operation, or failed required check returns the work
to coordination; it does not get weakened or merged.

## Remaining limits

The existing human source/license review gate remains open for any later library, vendor, copied material, or
production deployment. Browser, hosted Supabase, CI, load, and production egress behavior are not approved or
verified by this decision.
