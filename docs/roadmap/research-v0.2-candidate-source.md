# Research v0.2 candidate-package source extract

This is a factual extraction from the local planning reference `FeatureKit_Research_v2.pdf`, prepared so
agents that do not have the untracked PDF can complete the candidate-catalog task. It is not an approved
product roadmap or an implementation specification. No external validation is represented here.

- Source: *FeatureKit / Revised Research / v0.2*, 26 October 2026.
- Source pages: package profiles on printed pages 24–35; release gates on printed page 36.
- Status: the research calls all twelve packages **candidates** pending behavior contracts, source/license
  dossiers, implementation, verification, and lifecycle evidence. It says the former 150-feature catalog is
  superseded and must not be represented as supported.

| # | Candidate | Research stage | User outcome (paraphrased) | Stated dependencies | Source page |
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

## Research release sequence and shared dependencies

The research orders Data Import Center first, Webhook Developer Portal second, and Approval Workflows third.
It identifies audit and job primitives as shared dependencies rather than headline features. This identifies
research sequencing only; no candidate other than Import Center has an approved repository task.
