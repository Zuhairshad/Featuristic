# Candidate feature catalog

- Status: Planning inventory. **Not an approved roadmap and not an implementation specification.**
- Source: [`research-v0.2-candidate-source.md`](research-v0.2-candidate-source.md), the repository-available
  extraction of the local planning PDF *FeatureKit / Revised Research / v0.2* (26 October 2026). The PDF
  itself is untracked and was not read for this catalog.
- Task: [`docs/tasks/feature-catalog.md`](../tasks/feature-catalog.md)

## Status of this document

- This is a **candidate** inventory. The research calls all twelve packages candidates pending behavior
  contracts, source/license dossiers, implementation, verification, and lifecycle evidence.
- The former 150-feature catalog is **superseded**. It must not be represented as supported.
- **Only Import Center has an approved implementation task today**
  ([`docs/tasks/import-center.md`](../tasks/import-center.md), [ADR 0002](../adr/0002-import-center-reference-host.md)).
  Listing a candidate here does not approve, schedule, or estimate it. Any later candidate needs its own
  accepted task and ADR first.
- No external validation of any candidate is represented here.

## The twelve candidates

Research stage labels are preserved as written in the source. Outcomes are paraphrased. "Page" is the printed
page of the research document, as recorded in the source extract.

| # | Candidate | Research stage | User outcome (paraphrased) | Stated dependencies | Page |
| --- | --- | --- | --- | --- | --- |
| 1 | Data Import Center | flagship | Upload CSV data, map fields, preview validation and duplicates, process it, inspect progress, and download row errors. | Queue; object storage; tenant context; database adapter. | 24 |
| 2 | Webhook Developer Portal | launch | Register endpoints, choose events, rotate secrets, inspect delivery attempts, and replay failures. | Queue; outbound networking; secrets; transactional event source. | 25 |
| 3 | Approval Workflows | launch | Submit requests, assign reviewers, comment, decide, receive reminders, and inspect history. | Identity; permissions; durable scheduler; notifications. | 26 |
| 4 | Usage Billing and Credits | expansion | Inspect balances and usage, buy credits, set budgets, and investigate adjustments. | Transactions; jobs; billing provider; authoritative usage source. | 27 |
| 5 | Integration and Sync Hub | expansion | Connect a supported service, select scope, observe sync state, resolve errors, and disconnect. | Provider API; secret store; jobs; database adapter. | 28 |
| 6 | Advanced Sharing and Permissions | expansion | Share resources, inherit access, request access, and expire grants. | Identity; resource hierarchy; policy adapter; cache invalidation. | 29 |
| 7 | Background Operations Center | expansion | Track operations, inspect failures, cancel work, and retry permitted tasks. | Queue; durable state; actor/tenant context; logs. | 30 |
| 8 | Document Processing Workspace | expansion | Upload documents, inspect previews, review extracted fields, and search approved results. | Object storage; processing provider; jobs; search adapter. | 31 |
| 9 | Enterprise Workspace Administration | later | Manage domains, members, seats, SSO connections, and provisioning state. | Enterprise identity provider; membership store; session control. | 32 |
| 10 | Reservation and Capacity Engine | domain-specific | View availability, hold capacity, confirm or cancel reservations, and join waitlists. | Transactional storage; trusted clock; scheduler; notifications. | 33 |
| 11 | Customer Automation Builder | later | Configure triggers, conditions, and supported actions; inspect execution history. | Durable workflow adapter; connectors; permissions; secrets. | 34 |
| 12 | Audit and Investigation Console | supporting package | Search actor/resource timelines, compare changes, and export authorized evidence. | Actor context; durable event sink; policy; export jobs. | 35 |

Source locations: package profiles on printed pages 24–35 (one page per candidate, in the order above);
release gates on printed page 36.

## Research release sequence

The research orders the first three candidates as follows. This is research sequencing only. It is not an
approval, a schedule, or an estimate, and no later candidate is promoted by this document.

1. Data Import Center (first)
2. Webhook Developer Portal (second)
3. Approval Workflows (third)

## Dependency map (research dependencies, not implemented capabilities)

The research names **audit** and **job** primitives as shared dependencies rather than headline features.
None of the following exists as a FeatureKit platform capability today. ADR 0002 specifies a queue for the Import Center
reference host, scoped to that fixture and still in review; it is not an extracted platform primitive.

Grouping of the dependencies exactly as stated per candidate in the table above:

| Shared dependency family | Candidates that state it (by number) |
| --- | --- |
| Queue, jobs, or scheduler | 1 queue; 2 queue; 3 durable scheduler; 4 jobs; 5 jobs; 7 queue; 8 jobs; 10 scheduler; 12 export jobs |
| Actor, tenant, or identity context | 1 tenant context; 3 identity; 6 identity; 7 actor/tenant context; 12 actor context |
| Secrets or secret store | 2 secrets; 5 secret store; 11 secrets |
| Object storage | 1; 8 |
| Permissions or policy | 3 permissions; 6 policy adapter; 11 permissions; 12 policy |
| Notifications | 3; 10 |
| Durable event or state record | 2 transactional event source; 7 durable state; 12 durable event sink |

Reading the map:

- The queue/jobs/scheduler family is the most widely stated dependency (nine of twelve candidates), which is
  why the research treats a job primitive as shared.
- The audit primitive is named in the research as shared. In the per-candidate lists above it appears most
  directly as the durable event sink and actor context of the Audit and Investigation Console (candidate 12),
  and as logs, durable state, and actor/tenant context for the Background Operations Center (candidate 7).
  This catalog does not infer further audit dependencies that the source does not state.
- Candidates whose dependencies include an external provider (4 billing provider, 5 provider API, 8
  processing provider, 9 enterprise identity provider) depend on integrations the repository has no task for.

## Gaps this catalog does not close

- Behavior contracts, source/license dossiers, verification plans, and lifecycle evidence for each candidate
  (the research's stated pending items).
- Anything on the release-gates page (36) beyond its existence; it is not summarized in the source extract.
- Independent checking of the extract against the original PDF.
