# Webhook Developer Portal source dossier handoff

- Task: [`docs/tasks/webhook-developer-portal-source-dossier.md`](../tasks/webhook-developer-portal-source-dossier.md)
- Owner: Claude B
- Branch: `claude/webhook-portal-source-dossier-b`, created from `origin/feature/import-center` at
  `ca7bd580992875e7d0548ad6001300fe9121c177`
- Final commit: the head of the pull request. A file cannot contain its own hash; read it from `git log -1` or the PR.
- Deliverable: [`docs/evidence/webhook-developer-portal-source-dossier.md`](../evidence/webhook-developer-portal-source-dossier.md)

This is **research evidence, not approval**. No architecture, algorithm, vendor, schema, retry schedule, or policy
default was chosen, and no capability was tested.

## Delivered

| Path | Content |
| --- | --- |
| `docs/evidence/webhook-developer-portal-source-dossier.md` | Sources with retrieval dates and access levels; the research requirements R1 to R7; documented Next.js and Supabase capabilities (route and server boundaries, transactional data, secret handling, queue and background primitives); documented generic HTTP and web-security primitives; a requirement-by-requirement map of what is documented versus left to another adapter; ten unresolved decisions plus further open items; inconsistencies found; the source and license note; the next step only. |
| `docs/handoffs/webhook-developer-portal-source-dossier.md` | This file. |
| `docs/coordination/questions/claude-b.md` | A concise PR link and status note (added in a later commit, once the PR exists). |

No ADR, implementation task, manifest, code, migration, dependency, workflow, secret, credential, outbound request,
deployment, or remote-service configuration was added. PR #10 and Import Center files were not touched.

## Evidence method and its limits (read before relying on citations)

The authoring environment could not resolve `nextjs.org`, `supabase.com`, `rfc-editor.org`,
`datatracker.ietf.org`, `iana.org`, `httpwg.org`, or `fetch.spec.whatwg.org` (`getaddrinfo ENOTFOUND`).

- **Published page opened:** `nodejs.org` pages for `globals`, `dns`, `net`, and `crypto`.
- **Publisher documentation source opened:** the Markdown of the Next.js, Supabase, and OWASP pages, read from their
  public repositories on `raw.githubusercontent.com` (branches `canary` and `master`). This is the upstream text of
  the published pages but can be ahead of, or differ from, the live pages and the versions pinned in the fixture.
- **Search summaries:** used only to locate pages. One summary was contradicted by the opened source text (a
  `pg_net` credential warning that the page does not contain) and was discarded. No claim rests on a summary.
- **Read through a summarizing fetch tool:** quoted wording is a close paraphrase with short phrases, not a verbatim
  copy.
- **Not read:** `crypto.timingSafeEqual` (the section body fell outside the readable window; only a cross-reference
  was read), IETF RFCs, IANA address registries, the WHATWG Fetch Standard, Postgres's transaction documentation,
  and Supabase Edge Function limits. The dossier names them for ADR time and makes no claim from them.

## Verification

| Command | Result |
| --- | --- |
| `git fetch origin` | Canonical tip `ca7bd580992875e7d0548ad6001300fe9121c177`. |
| `git diff --check` on the staged files, before committing | Exit 0, no whitespace errors. |
| `git diff --cached` searched for key-shaped strings (`sk-`, `ghp_`, `github_pat_`, `AKIA`, private-key headers, JWT-like) | One match: this table row's own list of the patterns searched. No key. |
| `git diff --cached --name-only` searched for `.github/`, `*.yml`/`*.yaml`, lockfiles, `package.json`, source extensions | No matches. |
| `git diff --check origin/feature/import-center...HEAD` after the final commit | Exit 0 (stated in the PR description). |

The dossier contains product and vendor names and one example environment-variable naming prefix quoted from
documentation (`SUPABASE_`), but no credential, token, or example secret value.

## Remaining unresolved decisions

Unchanged by this task and listed in the dossier (section 5): tenant and admin authority, event sources, storage
retention, endpoint ownership, secret rotation and reveal policy, egress policy, replay permissions, idempotency,
ordering guarantee, and operator workflow, plus signature algorithm and format, retry schedule, the worker or
scheduler adapter, the hosting target for background work, and the event-source data model.

## Remaining gaps

- The documentation license terms were not reviewed, so the research record's source and license gate is not
  satisfied. An ADR must review each source and any proposed library or service.
- The published pages for the pinned Next.js and Supabase versions still need to be read.
- The `pg_net` page contradicts itself on supported methods; which statement is current is unresolved.
- Every fact in the dossier comes from documentation. Nothing was run, called, or tested.

## Git state

- Base: `origin/feature/import-center` at `ca7bd580992875e7d0548ad6001300fe9121c177`.
- This branch changes the three paths above only. No GitHub review comment was posted, nothing was merged, and no
  other agent's mailbox was edited.

## License provenance follow-up

Task: [`docs/tasks/webhook-developer-portal-source-license-provenance.md`](../tasks/webhook-developer-portal-source-license-provenance.md).
The dossier's new section 11 appends factual publisher and repository license notices. It is **evidence
collection only, not legal advice**, and it does not resolve the human legal-review gate or interpret any notice.

| Item | Value |
| --- | --- |
| Head before this follow-up | `6f2ba2411ae2441c3601cd8cb5e1d82a78a1a99b` |
| Canonical merged first | `origin/feature/import-center` at `f5bc77805e8d0d27050aab287f7bd699572670b9` |
| Merge commit | `dfc61d097962b44f757a0373c4bee6c170eb673f` (normal two-parent merge; no conflicts; no rebase or force-push) |

The PR head is the merge commit plus the follow-up commit that adds section 11 and this note. A file cannot
contain its own hash, so read the final head from `git log -1` or the PR.

### Files read (all retrieved 2026-10-27, only short identifying phrases recorded)

| Source | File | Result |
| --- | --- | --- |
| Next.js, Vercel | `vercel/next.js` `canary` `license.md` | Read: MIT, `Copyright (c) 2025 Vercel, Inc.` |
| Next.js, Vercel | `vercel/next.js` `canary` `README.md` | HTTP 404 |
| Supabase | `supabase/supabase` `master` `LICENSE` | Read: Apache License, Version 2.0, `Copyright 2024 Supabase`; no statement on `apps/docs` |
| Supabase | `README.md` and `apps/docs/README.md` | Read: no license statement |
| Node.js | `nodejs/node` `main` `LICENSE` | First 100,000 of 154,603 characters read: `Copyright Node.js contributors`, third-party components under their own licenses |
| Node.js | `doc/README.md`; published `nodejs.org/api/documentation.html` | Read: no license statement or notice in the text |
| OWASP | `OWASP/CheatSheetSeries` `master` `LICENSE` | HTTP 404 |
| OWASP | `LICENSE.md` | Read: Attribution-ShareAlike 4.0 International (CC-BY-SA-4.0) |
| OWASP | `README.md` | Read: no License section; one CC BY-SA 4.0 badge with no coverage statement |
| Revisions | `api.github.com/repos/<owner>/<repo>/commits/<branch>` for all four repositories | HTTP 403; commit SHAs and tags are **not established** |

Each file was read through a page-summarizing fetch tool and is identified by its exact raw URL in section 11.2 of
the dossier. No secondary license summary was used and no license text was copied.

### Not established

Exact revisions for all four repositories; published documentation terms for `nextjs.org`, `supabase.com`, and the
OWASP site (the first two did not resolve, the third was not opened); the unread 54,603 characters of the Node.js
`LICENSE`; and whether the repository licenses apply to the documentation content. The legal-review gate is
unresolved.

### Commands run and observed results (before committing)

| Command | Result |
| --- | --- |
| `git merge --no-ff origin/feature/import-center` | Exit 0, merge commit `dfc61d0`, no conflicts. |
| `git diff --stat` after appending section 11 | `docs/evidence/webhook-developer-portal-source-dossier.md`: 47 insertions, 0 deletions (append only). |
| `git diff --check` | Exit 0, no whitespace errors. |

The final comparison is checked after committing with `git diff --check origin/feature/import-center...HEAD` and
`git diff --name-only origin/feature/import-center...HEAD`; the results are in the PR description. No GitHub review
comment was posted, and PR #10, PR #1 and the other PR branches were not touched.
