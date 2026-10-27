# Approval Workflows source dossier handoff

- Task: [`docs/tasks/approval-workflows-source-dossier.md`](../tasks/approval-workflows-source-dossier.md)
- Owner: Claude A
- Branch: `claude/approval-workflows-source-dossier-a`, created from `origin/feature/import-center` at `3c726ac`
  (fetched before branching)
- Final commit: the head of the pull request. A file cannot contain its own hash; read it from `git log -1` or the PR.
- Deliverable: [`docs/evidence/approval-workflows-source-dossier.md`](../evidence/approval-workflows-source-dossier.md)

This is **research evidence, not approval**. No state schema, policy, scheduler, concurrency scheme or notification
vendor was chosen, and no capability was tested.

## Delivered

| Path | Content |
| --- | --- |
| `docs/evidence/approval-workflows-source-dossier.md` | Sources with retrieval date; the eight planning requirements (A1 to A8); documented capabilities for authenticated request boundaries, identity and authorization, persistent data and concurrency, queues and scheduled work, notifications, and audit and event capability, each with a "not stated" column; a requirement-by-requirement map; twelve unresolved decisions plus further open items; inconsistencies; the source and license note; the next step only. |
| `docs/handoffs/approval-workflows-source-dossier.md` | This file. |
| `docs/coordination/questions/claude-a.md` | A concise PR link and status note. |

No ADR, implementation task, manifest, code, migration, dependency, workflow, secret, credential, notification,
remote-service configuration or deployment was added. Webhook Developer Portal work and every other PR were not touched.

## Evidence method and limits

- **Access:** all 19 sources are first-party published pages opened directly with `curl` on 2026-10-27 (Next.js 4 pages,
  Supabase 13 pages, PostgreSQL 2 pages). Markup was stripped and the text searched, so quoted wording is a close
  paraphrase with short phrases. Where an initial search matched only navigation text, I located the page body and read
  the passage in context.
- **Verification of claims:** each documented fact was matched to its page text before writing. Claims I could not
  find as stated were not included (for example, an "exactly once" line was confirmed on the PGMQ page only after
  reading its body).
- **Version limits:** Next.js pages are labelled Latest v16.4.3 (the pinned version); the PostgreSQL pages are the
  version 18 docs while the fixture's stack uses Postgres 17; Supabase pages have no version label; some Supabase
  pages say "hosted platform" and local-stack availability is not stated.
- **PostgreSQL is upstream database documentation**, labelled as such, included because the concurrency requirement
  (concurrent approval and cancellation) is a database question the Supabase pages do not cover.
- **Absences:** every "not stated" entry means absent from the page read. The dossier says the pages read document no
  general notification service for reminders or escalation and no application-level audit-event facility; both are
  phrased as absences in the pages read, not as claims that none exists.
- **Not read:** listed in section 8 of the dossier (Postgres 17 pages, local-development Supabase pages, Edge Function
  limits, `pg_cron` missed-run behavior, web notification and push specifications, vendor documentation).

## Verification

| Command | Result |
| --- | --- |
| `git fetch origin` | Canonical tip `3c726ac`. |
| `git diff --check` (working tree, before committing) | Exit 0, no whitespace errors. |
| `git diff --name-only origin/feature/import-center...HEAD` (after the final commit) | The dossier, this handoff and `docs/coordination/questions/claude-a.md` only. |
| Search of added lines for key-shaped strings (`sk-`, `ghp_`, `github_pat_`, `AKIA`, private-key headers, JWT-like) | One match: this table row's own list of the patterns searched. No key. |
| `git diff --check origin/feature/import-center...HEAD` (after the final commit) | Exit 0. |

The dossier names products and vendors but contains no credential, token or example secret value.

## Remaining unresolved decisions

Unchanged by this task and listed in dossier section 5: identity and tenant model, separation-of-duties policy,
state and transition storage, concurrency control, cancellation policy, reviewer assignment, timer and scheduler
adapter, escalation and reminder behavior, notification adapter, authorization model, audit visibility and
retention, and the recovery model.

## Remaining gaps

- License terms of every source were not reviewed, so the research record's source and license gate is not satisfied.
  An ADR must review each source and any proposed library or service, by the appropriate human owner.
- The pages for the pinned versions (Postgres 17, local Supabase) still need to be read.
- Nothing was run, called or tested; every fact comes from documentation.

## Git state

- Base: `origin/feature/import-center` at `3c726ac`.
- This branch changes the three paths above only. No GitHub review comment was posted, nothing was merged, and no other
  agent's mailbox was edited.
