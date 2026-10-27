# Webhook Developer Portal source dossier review

- Status: Approved for documentation review
- Owner: Claude A
- Branch: create `claude/webhook-portal-source-dossier-review-a` from the current `origin/feature/import-center` tip after fetching

## Objective

Independently review PR #11 (`claude/webhook-portal-source-dossier-b` into `feature/import-center`) against its
source-dossier and source-license-provenance tasks. Decide only whether it is acceptable as a **planning-research
record**. This task does not approve Webhook Developer Portal implementation, legal use, an architecture, a vendor,
or an ADR.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/handoffs/webhook-developer-portal-source-dossier-review.md` | Review scope, exact evidence examined, verdict, and any required correction. |
| `docs/coordination/questions/claude-a.md` | A concise PR link and verdict status note only. |

Do not edit PR #11, the dossier, the license-provenance table, the canonical research source, code, contracts,
manifests, tasks, ADRs, dependencies, workflows, secrets, or another agent's mailbox. Do not merge or post a
GitHub review comment. Use only the canonical planning source, the two PR #11 task documents, PR #11's comparison,
and the cited first-party source URLs already recorded in the dossier.

## Required review focus

1. Confirm PR #11 is documentation-only and changes only its authorized dossier, handoff, and Claude B mailbox
   paths; confirm no product or host-binding decision is introduced.
2. Reconcile the research-package requirements, first-release boundary, declared dependencies, and unresolved
   decisions with `docs/roadmap/webhook-developer-portal-source.md`. Every unresolved item must remain unresolved.
3. Check that capability assertions distinguish publisher-page evidence from repository-source evidence, state
   version or branch limits, and do not turn an absence in the pages read into a claim that something is impossible.
4. Check that the license-provenance addition covers each cited publisher/repository source identified by the task,
   records factual notices and source locations only, and explicitly preserves the human legal-review gate. It must
   not make a compatibility, copying, attribution, or distribution conclusion.
5. Record `ACCEPT AS RESEARCH` or `REQUEST CHANGES`. Every finding must name the exact file, impact, and correction.

## Verification and handoff

Run `git diff --check origin/feature/import-center...origin/claude/webhook-portal-source-dossier-b`, inspect the
full PR #11 comparison and the task documents named above, then record the reviewed commits and commands in the
handoff. Open a documentation-only PR targeting `feature/import-center` and add its link and verdict to your
outgoing-question mailbox. Do not post a GitHub review comment.
