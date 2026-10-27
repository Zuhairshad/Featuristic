# Usage Billing and Credits source dossier

- Status: Approved for research documentation
- Owner: Claude B
- Branch: create `claude/usage-billing-and-credits-source-dossier-b` from the current `origin/feature/import-center` tip after fetching

## Objective

Build a current-official-source dossier for the Usage Billing and Credits candidate. This is research only: separate
documented host capabilities from unresolved product policy. Do not choose a payment provider or implementation
architecture.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/evidence/usage-billing-and-credits-source-dossier.md` | Current official-source links, retrieval dates, documented constraints, and limits. |
| `docs/handoffs/usage-billing-and-credits-source-dossier.md` | Scope, commands, Git state, verification, and unresolved decisions. |
| `docs/coordination/questions/claude-b.md` | A concise PR link and status note only. |

Use `docs/roadmap/usage-billing-and-credits-source.md` as the planning boundary. Research only current first-party
documentation applicable to the supported Next.js/React/TypeScript/Supabase host and standard web primitives. Do
not browse payment-provider material because no provider is selected. Do not call a payment API or create an account.

Do not add an ADR, implementation task, manifest, code, migration, dependency, workflow, secret, credential,
billing provider, billing account, remote-service configuration, deployment, or change to another feature's PR.

## Required content

1. Cite current official sources and retrieval dates for documented host capabilities relevant to authenticated
   request boundaries, persistent transactional data, authorization mechanisms, queues or scheduled background work,
   and audit/event constraints. Distinguish what is documented from what an adapter must supply.
2. Record the planning requirements: atomic reserve/settle/release, append-only accounting, idempotent ingestion,
   provider reconciliation, concurrent overspend prevention, and crash-after-provider-success reconciliation. Do
   not select currency, units, a ledger schema, a provider, provider-event mechanism, or job policy.
3. List every unresolved decision in the planning source, including currency/unit policy, provider, usage source,
   ledger/transaction semantics, concurrency, idempotency, provider ingestion, reconciliation, adjustments/refunds,
   budgets, jobs, tenant/authorization, and accounting/audit retention.
4. Include a source/license note and state only the next step: a separately approved ADR/task. Do not estimate
   effort, promise a release, or claim payment or provider behavior was tested.

## Verification and handoff

Run `git diff --check`, inspect the final diff for unauthorized paths or hidden secrets, and record exact commands
and results in the handoff. Open a documentation-only PR targeting `feature/import-center`, then add its link and
status to your outgoing mailbox. Do not post a GitHub review comment.
