# Webhook Developer Portal implementation ADR

- Status: Approved for ADR and implementation-task proposal
- Owner: Claude B
- Branch: create `claude/webhook-developer-portal-adr-b` from the current `origin/feature/import-center` tip after fetching

## Objective

As the sole Feature 2 owner, turn the accepted Webhook Developer Portal research into an implementation-ready,
**Proposed** ADR and a precise follow-on implementation task. This task does not authorize code, migrations,
outbound delivery, credentials, dependencies, or remote services.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/adr/0005-webhook-developer-portal.md` | Proposed decisions, alternatives, security controls, and acceptance criteria. |
| `docs/tasks/webhook-developer-portal-implementation.md` | Exact implementation scope, authorized paths/dependencies/local environment, and verification plan. |
| `docs/handoffs/webhook-developer-portal-adr.md` | Sources, decisions, unresolved limits, Git state, and review request. |
| `docs/coordination/questions/claude-b.md` | A concise PR link and status note only. |

Use only the accepted research sources and final review: `docs/roadmap/webhook-developer-portal-source.md`,
`docs/evidence/webhook-developer-portal-source-dossier.md` from PR #11,
`docs/evidence/webhook-developer-portal-transport-research.md` from PR #12, and
`docs/handoffs/webhook-developer-portal-research-final-review.md`. Re-read current official sources where a
proposed decision depends on a version-sensitive claim. Do not use community sources or a real webhook endpoint.

## Required decisions

Propose one documented recommendation and at least one rejected alternative for each item below. Mark the ADR
**Proposed**; do not treat a recommendation as accepted until the coordinator/user approves it.

1. Tenant/admin authority and RLS boundary; endpoint ownership and reviewer/admin actions.
2. Transactional event intent, stable receiver-visible event identity, and durable delivery/attempt accounting.
3. Secret storage, signing algorithm and format, rotation/reveal behavior, and redaction rules.
4. SSRF/egress control: URL parsing, scheme/port limits, forbidden destinations, DNS rebinding, redirects, retry
   paths, response/body limits, and timeouts.
5. Retry/backoff, idempotency, ordering, cancellation/replay, worker/scheduler placement, and failure recovery.
6. Retention, audit visibility, local Supabase provisioning, and the exact negative/integration tests needed.

The implementation task must name every file/path, dependency, local Supabase operation, test, and externally
observable behavior it would authorize. It must explicitly prohibit remote credentials, deployment, automatic merge,
and unapproved provider/vendor selection.

## Verification and handoff

Run `git diff --check`, inspect the final diff for unauthorized paths or secrets, and record exact commands/results.
Open a documentation-only PR targeting `feature/import-center`; add its link to your mailbox. Stop after the proposal
is published. The coordinator will review it before any implementation begins.
