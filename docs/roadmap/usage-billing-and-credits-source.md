# Usage Billing and Credits research source

> Status: **research evidence, not approval.** This record does not authorize a Usage Billing and Credits ADR, task
> for implementation, migration, dependency, payment provider, credential, billing account, or remote-service
> configuration.

## Source boundary

This factual extract was read from *FeatureKit / Revised Research / v0.2*, printed page 27, on 27 October 2026.
The PDF remains an untracked local planning reference. The candidate-source extract corroborates that this is package
4, an `expansion` candidate, and that its stated dependencies are transactions, jobs, a billing provider, and an
authoritative usage source.

## Directly supported package facts

| Topic | Research evidence |
| --- | --- |
| Stage and outcome | Package 4 is an **expansion** candidate. Users inspect balances and usage, buy credits, configure budgets, and investigate adjustments. |
| Frontend deliverables | Balance dashboard, usage charts, transaction history, and operator reconciliation. |
| Backend deliverables | Atomic reserve/settle/release, append-only accounting, idempotent ingestion, and provider reconciliation. |
| Bounded first release | One currency/unit policy and one payment provider first; no general banking ledger. |
| Critical verification | Concurrent requests cannot overspend; a crash after provider success is reconciled without double charge. |
| Declared dependencies | Transactions, jobs, a billing provider, and an authoritative usage source. |
| Candidate condition | The package remains a candidate until it has a migration/effect plan, exact-commit evidence, operational instructions, update/removal behavior, and the wider evidence gates. |

## Explicitly unresolved

The planning reference does not choose the currency/unit policy, billing provider, authoritative usage source,
transaction/ledger schema, reserve/settle/release semantics, concurrency control, idempotency identity, provider
event ingestion, reconciliation procedure, adjustment/refund policy, budget behavior, job/scheduler adapter,
tenant/authorization model, or accounting/audit retention. A future approved ADR and task must decide these from
current official sources and the supported host's actual bindings; none may be inferred from this record.

## Current repository boundary

Import Center remains the only implemented reference-host feature. Webhook Developer Portal has accepted research
evidence only. No Usage Billing and Credits implementation, billing provider, credential, account, local
provisioning, or remote service is approved.
