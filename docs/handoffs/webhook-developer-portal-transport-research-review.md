# Webhook Developer Portal transport research review handoff

- Task: [`docs/tasks/webhook-developer-portal-transport-research-review.md`](../tasks/webhook-developer-portal-transport-research-review.md)
- Reviewer: Claude B
- Subject: PR #12, `claude/webhook-portal-transport-research-a` into `feature/import-center`, author Claude A
- PR #12 head reviewed: `b419989b921668a2a4490bed5b2d3b415d3fdc57` (two commits: `cfb053d` "docs: webhook developer portal
  transport research" and `b419989` "docs: link transport research PR in Claude A status")
- PR #12 base: `f5bc77805e8d0d27050aab287f7bd699572670b9`
- Canonical tip at review: `9712c9da69e2673a5e08645de47413c9f8f60fb6`
- Review branch: `claude/webhook-portal-transport-research-review-b`, created from that canonical tip
- Method: a read of PR #12's full comparison and its task, then an independent re-read of the cited official sources
  wherever they were reachable from this environment. PR #12, its evidence note, the canonical research source, code,
  contracts, manifests, tasks, ADRs, dependencies, workflows, secrets and every other mailbox were not changed.

This review decides only whether PR #12 is acceptable as a **planning-research record**. It does not approve outbound
delivery, an endpoint-validation policy, a signing format, a worker, or a Webhook Developer Portal ADR.

## Verdict: REQUEST CHANGES

PR #12 is documentation-only, selects no policy, covers every required gap, and labels all eight ADR decisions
unresolved. Most of the facts I could re-check are accurate. Four small corrections are needed, each limited to one
file: one factual error in the Node.js version-skew statement (F1, which the task asks me to confirm), one omitted
documented fact in the timeout and abort coverage (F2), and two statements that go beyond their source (F3, F4). No
finding changes the note's structure or conclusions.

## Findings

All paths are in PR #12. Line numbers refer to `docs/evidence/webhook-developer-portal-transport-research.md` at
`b419989` unless stated.

### F1 (required): the version-skew statement is contradicted by the note's own F5.5

- File and lines: the evidence note, lines 35-38 ("Version skew to note"), against F5.5 on lines 136-138; the same
  claim is in `docs/handoffs/webhook-developer-portal-transport-research.md`, "Method and checks", second row ("Only
  APIs added long before v22 are cited").
- Text: "Only long-standing APIs are cited (each shows an 'Added in' version well below 22)".
- What the source says (Node.js `http` page, read today): the "Built-in Proxy Support" section is "Added in: v24.5.0,
  v22.21.0" with "Stability: 1.1 - Active development", and `http.setGlobalProxyFromEnv()` is "Added in: v25.4.0,
  v24.14.0". F5.5 cites exactly this section for its statements about proxies.
- Impact: the repository's supported range is `>=22.12.0`. Node.js 22.12.0 through 22.20.x is inside that range and
  lacks the documented built-in proxy support, so F5.5 does not describe the whole supported range. The note says
  the opposite, and the task explicitly requires the skew to be recorded plainly. An ADR author who trusts the
  sentence would not re-check F5.5.
- Required correction: replace the sentence with one that lists the exception, for example: "Most cited APIs show an
  'Added in' version below 22 (re-checked for `fetch` v17.5.0, `AbortSignal.timeout` v17.3.0, and `net.isIP` v0.3.0),
  but F5.5 does not: the page lists 'Built-in Proxy Support' as added in v24.5.0 and v22.21.0 (stability 1.1 - Active
  development) and `http.setGlobalProxyFromEnv()` as added in v25.4.0 and v24.14.0, so F5.5 does not describe Node.js
  22.12.0 to 22.20.x. An ADR must re-check every API against the supported range." Make the same correction in the
  handoff row, and drop "each shows an 'Added in' version well below 22" unless every cited API was re-checked.

### F2 (required): a documented fact about `timeout` and abort is omitted

- File and lines: the evidence note, F2.2 (lines 70-74) and the "Bounded retries" row of the mapping table (line 168).
- What the source says (Node.js `http` page, read today), under `http.request()`: "Setting the `timeout` option or
  using the `setTimeout()` function will not abort the request or do anything besides add a `'timeout'` event." The
  `'timeout'` event is described as "only notif[ying] that the socket has been idle. The request must be destroyed
  manually."
- Impact: the task requires timeout and abort behavior to be covered. F2.2 correctly says the documented timeout is a
  socket timeout and not an end-to-end deadline, but it omits the sentence that the option does not abort the
  request. That is the single most relevant documented fact about what a socket timeout does and does not do, and an
  ADR author reading only F2.2 could assume the timeout cancels the request.
- Required correction: add to F2.2 that the page says the `timeout` option and `setTimeout()` "will not abort the
  request or do anything besides add a `'timeout'` event" and that the request "must be destroyed manually", and
  reference F2.2 from the bounded-retries row.

### F3 (required, wording): an absence is stated as a fact

- File and lines: the evidence note, F5.7 (lines 142-143): "Nothing in the platform deduplicates a repeated `POST`."
- Problem: the note's own rule (line 42) is that "Not stated" means a cited page does not say something. The only
  source for F5.7 is RFC 9110's list of idempotent methods, which says nothing about platform deduplication, so the
  second sentence is a claim about the whole platform that no source read supports.
- Impact: it reads as a documented fact in a section the note labels "absences in the sources read".
- Required correction: change it to "The sources read describe no deduplication of a repeated `POST`."

### F4 (required, wording): a quoted phrase is not in the cited documentation source

- File and lines: the evidence note, F4.3 (lines 113-117): the page marks the feature "currently experimental and
  subject to change" (X-body).
- What I found: the Markdown source of `proxyClientMaxBodySize` at the `v16.4.3` tag (`docs/01-app/03-api-reference/05-config/01-next-config-js/proxyClientMaxBodySize.mdx`)
  states the 10MB default and says the body is buffered "When proxy is used", with the option nested under
  `experimental`, and its front matter reads `version: experimental`, but I did not find the quoted phrase in it. The
  phrase may come from a banner that the published site renders from the front matter; `nextjs.org` was not
  reachable from here, so I could not check the published page.
- Impact: a quotation attributed to a page, which the source does not contain, is the kind of claim a later reader
  will copy as verbatim.
- Required correction: either confirm the phrase against the published page and say so, or replace the quotation with
  "the page's front matter marks the option `experimental`" (no quotation marks).

## Review focus

| # | Focus | Result |
| --- | --- | --- |
| 1 | Documentation-only, only authorized paths, no policy or implementation decision | **Pass.** `git diff --name-status f5bc778...b419989` lists exactly `docs/coordination/questions/claude-a.md` (modified), `docs/evidence/webhook-developer-portal-transport-research.md` and `docs/handoffs/webhook-developer-portal-transport-research.md` (added). `git diff --check` exits 0. A search of the note for "should", "must", "recommend", "adopt", "choose" and similar finds only quotations of documentation (line 78) and pointers to a future ADR (lines 37, 195, 207). Nothing selects a policy. |
| 2 | Each assertion supported by the cited official source, with documented behavior separated from what the documents do not state | **Mostly pass, with F1 to F4.** See "Re-checked claims" below. The note's "Not stated" convention is applied consistently. |
| 3 | Covers URL and endpoint, timeout and abort, redirect, response and body bound, and automatic-protection gaps, and maps facts to the six concerns | **Pass, with F2.** Sections 1 to 5 cover each gap, and the mapping table has a row for each of endpoint validation, forbidden-destination blocking, bounded retries, stable event identity, payload redaction, and delivery accounting, with what the sources leave open. |
| 4 | Required future-ADR questions unresolved, Node skew recorded, no legal conclusion | **Pass on unresolved labels and legal wording; Node skew is recorded but inaccurate (F1).** U1 to U8 cover SSRF and egress, signing algorithm and rotation, idempotency, retry and backoff, ordering, observability and redaction, response handling, and runtime placement, each labelled **UNRESOLVED**. The provenance section says "not legal advice" and draws no conclusion on use, copying or compatibility. |
| 5 | Verdict | `REQUEST CHANGES` (F1 to F4). |

## Re-checked claims

"Confirmed" means I read the cited source today and found the stated text. Sources that were reachable: Node.js
pages at `nodejs.org`; Next.js and WHATWG documentation and specification **source** from their publishers'
repositories on `raw.githubusercontent.com` (Next.js at the `v16.4.3` tag; `whatwg/fetch` `fetch.bs` and `whatwg/url`
`url.bs` on `main`). The published `nextjs.org`, `fetch.spec.whatwg.org`, and `url.spec.whatwg.org` pages were not
reachable. Reads went through a page-summarizing fetch tool, so the wording is a close paraphrase.

| Claim | Source | Result |
| --- | --- | --- |
| F1.1 `URL.canParse()` returns false on parser failure | `url.bs` | Confirmed |
| F1.2 special schemes and default ports; credentials definition; `invalid-credentials` is not a failure | `url.bs` | Confirmed |
| F1.3 IPv4 parser accepts `0x` and leading-`0` parts; the three example URLs | `url.bs` | Confirmed |
| F1.4 `net.isIP()` rejects `127.000.000.001` | Node `net` | Confirmed (read earlier this session) |
| F1.5 bad ports include 22, 25 and 53 | `fetch.bs` | Confirmed |
| F2.1 `AbortSignal.timeout`; `fetch` described as browser-compatible and undici-based; `fetch()` aborts when the request signal aborts | Node `globals`; `fetch.bs` | Confirmed |
| F2.2 `timeout` and `signal` option text; `request.setTimeout()` calls `socket.setTimeout()` once connected | Node `http` | Confirmed; omission recorded as F2 |
| F2.4 `headersTimeout` and `requestTimeout` Denial-of-Service sentence; Next.js reverse-proxy list | Node `http`; Next.js `self-hosting.mdx` | Confirmed |
| F2.5 `maxDuration` default "Set by deployment platform"; `runtime` `'nodejs'` default and `'edge'` deprecated | Next.js route-segment-config (`index.mdx`) | Confirmed |
| F3.1 redirect modes `follow`, `error`, `manual` | `fetch.bs` | Confirmed |
| F3.2 redirect count 20 gives a network error | `fetch.bs` | Confirmed |
| F3.3 method set to `GET` and body cleared; `Authorization` removed cross-origin (Fetch part) | `fetch.bs` | Confirmed |
| F3.4 Node `http` mentions redirects only in an event-order note | Node `http` | Confirmed |
| F4.2 `maxHeaderSize` default 16 KiB and per-request option | Node `http` | Confirmed |
| F4.3 10MB default, buffered "When proxy is used", option under `experimental`; Route Handlers read the body with `request.json()` and `request.formData()` and the page documents no limit | Next.js `proxyClientMaxBodySize.mdx`; `route.mdx` | Confirmed, except the quoted phrase (F4) |
| F5.1 `dns.lookup()` text; `net.BlockList` sentence; no private-network, loopback, or local-network wording in the Fetch standard | Node `dns`, `net`; `fetch.bs` (all windows read) | Confirmed. The absence check relied on the summarizing tool over every part of the file. |
| F5.2 `lookup` option defaults to `dns.lookup()` | Node `net` (`socket.connect()` section) | Confirmed under `socket.connect()`; the `net.connect()` section was not read |
| F5.5 proxy sentences | Node `http` | Confirmed, but see F1 for the version |

## Not independently verified by me

- RFC 9110 claims (F2.6 including the quotation of the 408 text, F3.3's "prevailing practice" and "needs to be done
  with care" wording, F5.7's idempotent-methods sentence, F6.4), RFC 9421 (F6.3), and the IANA IPv4 registry (F5.6),
  and the IETF Trust and WHATWG license statements in the provenance section: the IETF, RFC editor, and IANA hosts
  did not resolve from this environment, and no mirror was used.
- `crypto.timingSafeEqual` and `crypto.randomUUID` (F6.1, F6.2): those sections fell outside the window the fetch
  tool could read.
- Whether `net.BlockList` and the other cited APIs show an "Added in" version below 22 (only `fetch`,
  `AbortSignal.timeout`, `net.isIP`, and the proxy entries were re-checked).
- Whether the published `nextjs.org` pages match the documentation source at `v16.4.3`.
- No runtime behavior of Node.js `fetch` (undici) was tested, and no source outside the task's list was used.
- The note was not compared with Claude B's dossier (PR #11), which this review does not edit or depend on.

## Observations (no change required)

- **O1.** The note's F5.2 attributes the `lookup` option to `net.connect()`; the page text I read lists it under
  `socket.connect()`. They are linked, and I did not read the `net.connect()` section, so I do not treat it as an
  error.
- **O2.** PR #12 branched at `f5bc778` and is behind the canonical tip `9712c9d` by two documentation-only task files
  that it does not touch. A three-dot comparison, which GitHub shows, contains only its three paths; a two-dot
  comparison against the tip shows those two task files as deletions.

## Commands run and observed results

| Command | Result |
| --- | --- |
| `git fetch origin` | PR #12 head `b419989`; canonical tip `9712c9d`. |
| `git merge-base origin/claude/webhook-portal-transport-research-a origin/feature/import-center` | `f5bc778`. |
| `git diff --name-status origin/feature/import-center...origin/claude/webhook-portal-transport-research-a` | The three paths listed above. |
| `git diff --check origin/feature/import-center...origin/claude/webhook-portal-transport-research-a` | Exit 0. |
| Reads of the cited pages and specification sources listed under "Re-checked claims" | Results as stated there. |
| `git diff --check origin/feature/import-center...HEAD` (this branch) | See the PR description for the result after the final commit. |

No GitHub review comment was posted and nothing was merged.

## Git state

- Base: `origin/feature/import-center` at `9712c9da69e2673a5e08645de47413c9f8f60fb6`.
- This branch adds `docs/handoffs/webhook-developer-portal-transport-research-review.md` and a status note in
  `docs/coordination/questions/claude-b.md`. The PR head is read from `git log -1` or the PR, since a file cannot
  contain its own hash.
- PR #12, PR #11, PR #10, PR #1 and their branches were not modified.
