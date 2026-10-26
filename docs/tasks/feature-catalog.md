# Candidate feature catalog

- Status: Approved for documentation
- Owner: Claude A
- Branch: create `claude/feature-catalog` from `origin/feature/import-center` at `9cb23a9`

## Objective

Turn the 12 candidate packages in `FeatureKit_Research_v2.pdf` into a durable, factual planning inventory.
This task documents research evidence so later feature tasks can be created quickly. It does not approve a
candidate for implementation, alter the Import Center PR, or replace the accepted task/ADR process.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/roadmap/candidate-features.md` | The 12-candidate inventory, source evidence, and non-approval status. |
| `docs/handoffs/feature-catalog.md` | Commands used, Git state, and remaining planning gaps. |

Do not change code, contracts, manifests, dependencies, existing feature tasks, `main`, or PR #1. Do not add
new ADRs or implementation tasks. Do not browse for or claim external validation of the candidates.

## Required content

1. List exactly these twelve research candidates, preserving their research stage labels: Data Import Center,
   Webhook Developer Portal, Approval Workflows, Usage Billing and Credits, Integration and Sync Hub,
   Advanced Sharing and Permissions, Background Operations Center, Document Processing Workspace, Enterprise
   Workspace Administration, Reservation and Capacity Engine, Customer Automation Builder, and Audit and
   Investigation Console.
2. For each candidate, record its research-PDF user outcome, its stated dependencies, and the PDF page/source
   location. Quote no more than a short identifying phrase per feature; summarize the rest.
3. State clearly that the former 150-feature catalog is superseded, this is a **candidate** inventory, and only
   Import Center has an approved implementation task today.
4. Preserve the research release sequence: Import Center first, Webhook Developer Portal second, Approval
   Workflows third. Do not promote later candidates or invent estimates.
5. Include a short dependency map that identifies shared job and audit primitives as research dependencies,
   not implemented platform capabilities.

## Verification and handoff

Run `git diff --check`. Review the final diff for accidental scope expansion. Record the exact Git state and
verification command in `docs/handoffs/feature-catalog.md`, then open a documentation-only PR targeting
`feature/import-center`. Post its link and evidence in the Claude A mailbox.
