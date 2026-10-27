# Webhook Developer Portal source dossier

- Status: Approved for research documentation
- Owner: Claude B
- Branch: create `claude/webhook-portal-source-dossier-b` from the current `origin/feature/import-center` tip after fetching

## Objective

Build a current-official-source dossier for the Webhook Developer Portal candidate. This is research only: it
must separate documented capabilities from unresolved product policy and must not choose an implementation
architecture.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/evidence/webhook-developer-portal-source-dossier.md` | Current official-source links, retrieved dates, supported claims, and limits. |
| `docs/handoffs/webhook-developer-portal-source-dossier.md` | Scope, commands, Git state, verification, and remaining unresolved decisions. |
| `docs/coordination/questions/claude-b.md` | A concise PR link and status note only. |

Use `docs/roadmap/webhook-developer-portal-source.md` for the planning boundary. Research only first-party,
current documentation relevant to the supported Next.js/React/TypeScript/Supabase host and generic documented
HTTP/web-security primitives. Do not browse community tutorials or rely on memory.

Do not add an ADR, task for implementation, manifest, code, migration, dependency, workflow, secret,
credential, outbound-network call, deployment, or remote-service configuration. Do not modify PR #10; it is a
valid record of the cloud-session PDF limitation.

## Required content

1. Cite official sources and retrieval dates for every documented technical claim. At minimum distinguish what
   the supported host documents about route/server boundaries, persistent transactional data, secret handling,
   and any queue/background primitive from what must be supplied by another adapter.
2. Record the research package requirements from the canonical source record: signed deliveries, bounded retries,
   endpoint validation, delivery accounting, payload redaction, forbidden-destination blocking, and stable event
   identity after timeout. Do not select algorithms, vendors, schemas, retry schedules, or policy defaults.
3. Identify every unresolved product or host-binding decision needed before an ADR: tenant/admin authority,
   event sources, storage retention, endpoint ownership, secret rotation/reveal policy, egress policy, replay
   permissions, idempotency, ordering guarantee, and operator workflow.
4. Include a source/license note and propose only the next step: a separately approved ADR/task. Do not estimate
   effort, promise a release, or claim that an external capability was tested.

## Verification and handoff

Run `git diff --check`, inspect the final diff for unauthorized paths or hidden secrets, and record exact commands
and results in the handoff. Open a documentation-only PR targeting `feature/import-center`, then add its link and
status to your outgoing mailbox. Do not post a GitHub review comment.
