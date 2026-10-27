# Webhook Developer Portal transport research

- Status: Approved for research documentation
- Owner: Claude A
- Branch: create `claude/webhook-portal-transport-research-a` from the current `origin/feature/import-center` tip after fetching

## Objective

Research transport-boundary evidence for the Webhook Developer Portal candidate independently of Claude B’s source
dossier. This task produces a narrowly scoped evidence note only; it does not propose an architecture or authorize
implementation.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/evidence/webhook-developer-portal-transport-research.md` | Current first-party transport/security references, factual constraints, and unknowns. |
| `docs/handoffs/webhook-developer-portal-transport-research.md` | Scope, sources, Git state, verification, and limits. |
| `docs/coordination/questions/claude-a.md` | A concise PR link and status note only. |

Use `docs/roadmap/webhook-developer-portal-source.md` as the candidate boundary. Consult only current official
documentation for applicable Next.js/Node.js HTTP server behavior and web-platform HTTP/URL/security primitives.
Do not browse community material, test a real endpoint, or infer the project’s eventual egress/security policy.

Do not modify an existing PR, add an ADR, feature task, manifest, code, migration, dependency, workflow, secret,
credential, remote service configuration, or deployment.

## Required content

1. Capture source-backed facts relevant to safely making bounded server-side HTTP deliveries: URL parsing and
   validation boundaries, request timeouts/abort behavior, redirect handling, response/body limits, and what the
   documented platform does **not** protect automatically.
2. Map each fact to a research-package concern—endpoint validation, forbidden-destination blocking, bounded
   retries, stable event identity, payload redaction, and delivery accounting—without choosing a final policy.
3. List non-negotiable unresolved ADR decisions, including SSRF/egress controls, signing algorithm and rotation,
   idempotency, retry/backoff, ordering semantics, and observability/redaction. Label each as unresolved.
4. Note source/license provenance and state that the result is evidence for a future approved ADR/task only.

## Verification and handoff

Run `git diff --check`, inspect the final paths and source links, then open a documentation-only PR targeting
`feature/import-center`. Add its link and status to your outgoing mailbox. Do not post a GitHub review comment.
