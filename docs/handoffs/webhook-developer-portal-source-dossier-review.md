# Webhook Developer Portal source dossier review

- Task: [`docs/tasks/webhook-developer-portal-source-dossier-review.md`](../tasks/webhook-developer-portal-source-dossier-review.md)
- Reviewer: Claude A
- Subject: PR #11, `claude/webhook-portal-source-dossier-b` into `feature/import-center`, author Claude B
- Reviewed PR #11 head: `478183235bda5cdbbcacfb40049f9c45e361a67f`
  (commits `5486f74` dossier, `6f2ba24` mailbox, `dfc61d0` canonical merge, `4781832` license provenance)
- PR #11 merge base with canonical: `f5bc77805e8d0d27050aab287f7bd699572670b9`
- Canonical tip when this review branch was created: `9712c9d`
- Review branch: `claude/webhook-portal-source-dossier-review-a`, created from that tip
- Sources used: `docs/roadmap/webhook-developer-portal-source.md`, the two PR #11 task documents
  (`webhook-developer-portal-source-dossier.md`, `webhook-developer-portal-source-license-provenance.md`), the PR #11
  comparison, and the first-party URLs already cited in the dossier. No file of PR #11 or any other branch was
  changed, no GitHub review was posted, and I did not use my own transport-research PR as evidence.

## Verdict: REQUEST CHANGES (two small documentation corrections)

As a research record the dossier is sound. Its technical claims that I re-checked against the cited sources are
accurate, evidence levels and branch limits are stated, absences are phrased as absences in the pages read, no
decision is made, and the license section records notices only. Two small defects keep it from a clean
`ACCEPT AS RESEARCH`: one unresolved item from the planning record is missing from the dossier's decision list,
and section 11 describes an edit to section 9 that was not made. Both are one-paragraph fixes in one file and
neither involves a technical claim. After they are applied I expect no further finding.

## Required review focus: results

### 1. Scope of PR #11

| Check | Result |
| --- | --- |
| `git diff --check origin/feature/import-center...origin/claude/webhook-portal-source-dossier-b` | Exit 0. |
| `git diff --name-status` (three-dot) | `docs/evidence/webhook-developer-portal-source-dossier.md` (A), `docs/handoffs/webhook-developer-portal-source-dossier.md` (A), `docs/coordination/questions/claude-b.md` (M). Exactly the authorized paths. |
| `.github/` paths on the PR head; key-shaped strings in added lines | `0`; one match, which is the handoff row listing the patterns that were searched. No credential. |
| Mailbox change | Replaces the placeholder line and adds two PR link and status entries. Claude B's own file, as the task allows. |
| Product or host-binding decision introduced | None. The dossier states it "chooses no architecture, algorithm, vendor, schema, retry schedule, or policy default". |
| Deleted lines | One (the mailbox placeholder). |

### 2. Reconciliation with `docs/roadmap/webhook-developer-portal-source.md`

| Item | Result |
| --- | --- |
| Seven package requirements (signed deliveries, bounded retries, endpoint validation, delivery accounting, payload redaction, forbidden-destination blocking, stable event identity after a receiver times out) | All seven present as R1 to R7 and traced in the section 4 map. |
| Bounded first release (outbound only, fixed event catalog, documented ordering guarantees) | Present in section 2. |
| Declared dependencies (queue, outbound networking, secrets, transactional event source) | Present in section 2. |
| Unresolved items named by the planning record: tenant and authorization model, event-source data model, **endpoint-storage shape**, secret lifecycle, retry schedule, signature algorithm, egress guard, replay authorization, retention, worker/scheduler adapter | Nine of ten appear in section 5 or its "Also unresolved" paragraph, all marked Unresolved. **Endpoint-storage shape** appears only in the section 2 restatement; it is not in the section 5 decision list. See F1. |
| Repository boundary | Correct: Import Center's task and ADR 0002 prevail, no webhook task or ADR is approved, and the repository's `pgmq` queue is called fixture-only. |

### 3. Capability assertions

| Check | Result |
| --- | --- |
| Publisher-page evidence versus repository-source evidence | Every row carries an access level (Page, Source, Not read); section 1 defines them, and states that Source rows can differ from live pages. |
| Version or branch limits | Section 1 and section 6 name `canary` and `master`, note they can be ahead of the pinned Next.js `16.4.3` and `@supabase/supabase-js` `2.118.0`, and require a re-read for the pinned versions. |
| Absence turned into impossibility | None found. Every "not stated" column and the requirement map phrase gaps as "the pages read do not document it". |
| Discarded claim | The dossier records a search-summary claim it dropped because the opened `pg_net` source did not contain it. This is good practice. |

Re-checks against the cited sources (all reachable from my environment; fetched from the same publisher
repositories on 2026-10-27):

| Dossier claim | Source file | Result |
| --- | --- | --- |
| `pg_net`: "HTTP requests are not started until the transaction is committed"; default timeout 2000 ms | `pg_net.mdx` | Confirmed (per-function text; `timeout_milliseconds ... default 2000`). |
| `pg_net`: responses stored 6 hours; UNLOGGED tables "not preserved during a crash or unclean shutdown"; up to 200 requests per second | `pg_net.mdx` | Confirmed. |
| `pg_net`: `net` schema grants `USAGE` to `PUBLIC` by default and is not exposed through the Data API | `pg_net.mdx` | Confirmed. |
| `pg_net` page contradicts itself on methods | `pg_net.mdx` | Confirmed: `http_get`, `http_post` and `http_delete` sections versus a limitation that it "Can only make POST requests with JSON data". |
| `pgmq`: "exactly once" within a visibility timeout; `pop` gives at-most-once; archive for retention and replayability; unlogged queue; no retry or dead-letter text | `pgmq.mdx` | Confirmed, including the absence (no search hit for retry, dead-letter or poison). |
| Next.js `after`: runs for the platform's max duration, `maxDuration`, `waitUntil`, runs even if the response fails; Docker yes, static export no, adapters platform-specific | `after.mdx` | Confirmed. |
| OWASP: "Deny-lists are bypass-prone. Prefer allow-lists."; block-list "is not an impenetrable wall"; a second unchecked DNS lookup can bypass checks; apply policy to retries and fallback connections | `Server_Side_Request_Forgery_Prevention_Cheat_Sheet.md` | Confirmed. |

### 4. License-provenance section (11)

| Check | Result |
| --- | --- |
| Covers each cited publisher and repository | Yes: Next.js/Vercel, Supabase, Node.js, OWASP, matching sections 3 and 7. |
| Notices recorded as found | Re-read from the publishers' own files: Next.js `license.md` is the MIT License with `Copyright (c) 2025 Vercel, Inc.`; Supabase `LICENSE` is Apache License 2.0 with `Copyright 2024 Supabase`; Node.js `LICENSE` opens "Node.js is licensed for use as follows" with `Copyright Node.js contributors`; OWASP `LICENSE.md` is Attribution-ShareAlike 4.0 International (SPDX CC-BY-SA-4.0). All match. |
| Source locations and exact URLs | Present (raw URLs per file). Revisions are honestly recorded as "not established" because the GitHub API returned 403. |
| Compatibility, copying, attribution or distribution conclusion | None. A search of section 11 for permissive or obligation language found only the sentence that disclaims such conclusions. |
| Legal-review gate preserved | Yes: section 11.4 says the gate "stays open" and any ADR needs its own human license review. |
| Published documentation terms | Marked "not established" for all four, with the reason. Appropriate. |
| Consistency with section 9 | Not fully consistent. See F2. |

## Findings

### F1 (required, low): "endpoint-storage shape" is missing from the unresolved-decision list

- File: `docs/evidence/webhook-developer-portal-source-dossier.md`, section 5 (table and the "Also unresolved" paragraph).
- Problem: `docs/roadmap/webhook-developer-portal-source.md` lists "endpoint-storage shape" among the items the
  references do not settle. The dossier restates it in section 2 but section 5, which presents itself as the list
  of decisions "needed before an ADR", has no row for it. "Endpoint ownership" is a different decision (who owns
  an endpoint, not how endpoints are stored).
- Impact: an ADR author using section 5 as the checklist could miss a decision the planning record says is open.
  Nothing is wrongly marked resolved.
- Exact correction: add `endpoint-storage shape` to the "Also unresolved" paragraph in section 5, for example by
  inserting it before "the event-source data model": "...the hosting target for background work and its duration
  limits, the endpoint-storage shape, and the event-source data model." Alternatively add a table row "Endpoint
  storage shape | None of the pages read | Unresolved".

### F2 (required, low): section 11 says it replaced a statement in section 9, but section 9 is unchanged

- File: `docs/evidence/webhook-developer-portal-source-dossier.md`, section 11 introduction and section 9.
- Problem: section 11 says it "replaces only the statement in section 9 that no notice had been looked at". Section 9
  is byte-for-byte what it was before: it still opens "These are documentation sources whose license terms were
  **not reviewed** in this task". A reader sees two statements that point different ways, and the replacement
  that section 11 describes was never made.
- Impact: documentation consistency only; the gate statement is correct in both places (still open).
- Exact correction: edit the first sentence of section 9 to say that publisher and repository notices were
  collected in section 11 as evidence only and that the license terms themselves were not reviewed or
  interpreted, and keep the remainder of section 9 unchanged. Then section 11's sentence is accurate.

## Optional notes (not required)

- **O1.** Section 1 and the handoff say `nextjs.org`, `supabase.com`, `rfc-editor.org`, `iana.org` and
  `fetch.spec.whatwg.org` did not resolve. That was true of the authoring environment. They resolved from mine, so
  the "Source" rows could be upgraded to "Page" rows and the section 8 "not read" list can be read directly at ADR
  time. This does not change any claim.
- **O2.** Section 3.5 row G4 records that the `crypto.timingSafeEqual` section body was not read. That gap is
  readable from the same Node.js page the dossier cites; closing it is an ADR-stage reading task, as section 8 says.

## What I ran

| Command or action | Result |
| --- | --- |
| `git fetch origin` | Canonical `9712c9d`; PR #11 head `4781832` per the branch tip, `4781832...` resolves to `478183235bda...`. |
| `git diff --check origin/feature/import-center...origin/claude/webhook-portal-source-dossier-b` | Exit 0. |
| `git diff --name-status`, `git diff --stat`, `git log --oneline` for the same range | Three paths; 392 insertions, 1 deletion; four commits. |
| Search of added lines for key-shaped strings; `.github/` count | One self-referential match; `0`. |
| Read the dossier (246 lines), the PR #11 handoff, both task documents, and the planning source | Findings above. |
| Fetched `pg_net.mdx`, `pgmq.mdx`, `after.mdx`, the SSRF cheat sheet, and the four license files from the publishers' repositories and compared with the dossier | Results in section 3 and 4 tables. |

## Not verified

- I did not re-check every row of the dossier, only those listed above (the `pg_net`, `pgmq`, `after`, OWASP and
  license claims). The remaining Supabase Vault, Edge Function, RLS, cron and Next.js environment-variable rows
  were read for consistency with the planning source but not re-fetched.
- Nothing was executed. Live published pages were not compared with the repository sources.
- Whether the repository licenses cover the documentation content is a legal question this review does not
  answer; the human legal-review gate is untouched.

## Git state

- Base: `origin/feature/import-center` at `9712c9d`.
- This branch adds this file and a status entry in `docs/coordination/questions/claude-a.md`. Read the final head
  from `git log -1` or the PR; a file cannot contain its own hash.
- PR #11, the dossier, the canonical planning source, PR #12 and every other mailbox were not changed. Nothing was merged.
