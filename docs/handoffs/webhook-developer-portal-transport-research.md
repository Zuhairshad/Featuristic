# Webhook Developer Portal transport research handoff

- Task: [`docs/tasks/webhook-developer-portal-transport-research.md`](../tasks/webhook-developer-portal-transport-research.md)
- Owner: Claude A
- Branch: `claude/webhook-portal-transport-research-a`, created from `origin/feature/import-center` at
  `f5bc778` (fetched before branching)
- Deliverable: [`docs/evidence/webhook-developer-portal-transport-research.md`](../evidence/webhook-developer-portal-transport-research.md)

## Scope

A source-cited evidence note on first-party transport and security facts relevant to bounded server-side HTTP
deliveries, mapped to the six research-package concerns, plus the eight unresolved ADR decisions, each labelled
unresolved. It selects no architecture, egress rule, signing algorithm, retry schedule or retention period, and
approves nothing. The candidate boundary is `docs/roadmap/webhook-developer-portal-source.md`; I did not read
Claude B's separate dossier (PR #11) so that this record stays independent.

## Sources

Fourteen first-party pages, listed with URLs and version in the evidence note: Node.js (HTTP, Globals, Net, DNS,
Crypto), Next.js (Route Handlers, Route segment config, Self-hosting, `proxyClientMaxBodySize`), WHATWG (Fetch, URL),
IETF (RFC 9110, RFC 9421) and the IANA IPv4 special-purpose registry. All were reachable from this environment and
fetched with `curl` on 2026-10-27. No community material was used, no endpoint was contacted and nothing was run.

## Method and checks

| Step | Result |
| --- | --- |
| Fetch each page, strip markup, search for the exact API and rule named in each fact | Every cited fact has a source id; passages were read in context, not from the table of contents. |
| Compare the repository's Node range (`>=22.12.0`) with the documented version (Node.js v26.12.1) | **Corrected (PR #14 F1).** Thirteen cited APIs were re-checked and show "Added in" versions below 22, but the built-in proxy support cited in F5.5 is listed as added in v24.5.0 and v22.21.0 (stability 1.1), so F5.5 does not cover Node.js 22.12.0 to 22.20.x. Per-option additions were not re-checked. The earlier statement that every cited API predates v22 was wrong and is removed. |
| Check licence statements where the page gives one | WHATWG (CC BY 4.0, code BSD 3-Clause) and RFC 9110 (IETF Trust) recorded; Node.js, Next.js and IANA licence terms were not checked and the note says so. |
| Absence claims ("not stated") | Phrased as absent from the pages read, not as a claim that a protection is impossible; the note names what each search covered. |
| `git diff --check` | Exit 0. |
| Changed paths | The evidence note, this handoff, and Claude A's mailbox only. |

## Findings most relevant to a future ADR (summary, not decisions)

- No source read provides automatic protection against requests to private, loopback or link-local addresses;
  `net.BlockList` exists, and the Node page read does not say that `fetch` uses it.
- The Fetch Standard caps redirects at 20 and re-checks origins and credentials, but defines no re-validation of a
  redirect target's resolved address.
- The documentation describes socket and abort-signal timeouts but no single end-to-end deadline, and defines no
  maximum response size.
- The WHATWG IPv4 parser normalizes hexadecimal and octal parts, so validating the input string is not the same as
  validating the parsed host.

## Not verified

- No behavior was executed; the Node `fetch` (undici) runtime behavior for redirects, bad ports, streaming and
  abort is not described by the Node.js pages read, and the undici project's docs are outside the task's source list.
- IPv6 special-purpose handling was not read in detail.
- Quoted text is extracted from rendered pages and may differ from page markup; pages are living documents.

## Git state

- Base: `origin/feature/import-center` at `f5bc778`.
- This branch adds the evidence note, this handoff, and a status entry in `docs/coordination/questions/claude-a.md`.
  Read the final head from `git log -1` or the PR; a file cannot contain its own hash.
- No existing PR, ADR, task, code, dependency, workflow, secret or other mailbox was changed. Nothing was merged.

## Corrections after the PR #14 review

Task: [`docs/tasks/webhook-developer-portal-transport-research-corrections.md`](../tasks/webhook-developer-portal-transport-research-corrections.md).
Review: PR #14 (`claude/webhook-portal-transport-research-review-b`, Claude B), verdict REQUEST CHANGES, findings F1 to F4.

| Item | Value |
| --- | --- |
| Head reviewed in PR #14 | `b419989b921668a2a4490bed5b2d3b415d3fdc57` |
| Canonical merged first | `origin/feature/import-center` at `16a4b87` (normal merge; no conflicts; no rebase or force-push) |

| Finding | Correction in `docs/evidence/webhook-developer-portal-transport-research.md` |
| --- | --- |
| F1 | "Version skew" now lists the re-checked APIs and states the exception: built-in proxy support (F5.5) is listed as added in v24.5.0 and v22.21.0 with stability 1.1, and `http.setGlobalProxyFromEnv()` in v25.4.0 and v24.14.0, so F5.5 does not describe Node.js 22.12.0 to 22.20.x. The "well below 22" claim is removed. This handoff's method row is corrected the same way. |
| F2 | F2.2 now quotes the `http` page: the `timeout` option and `setTimeout()` "will not abort the request or do anything besides add a 'timeout' event", the request "must be destroyed manually", while an `AbortSignal` abort behaves like `.destroy()`. The bounded-retries mapping row points to F2.2. No timeout policy is selected. |
| F3 | F5.7 now reads "The sources read describe no deduplication of a repeated `POST`." |
| F4 | F4.3 keeps the quoted phrase because I read it directly on the published `nextjs.org` page on 2026-10-27, and records that the v16.4.3 Markdown source (per PR #14) has `version: experimental` front matter and not that sentence, so the quotation rests on the published page alone. |

Re-reads for these corrections (2026-10-27): the Node.js `http`, `globals`, `net`, `dns` and `crypto` pages (the
"Added in" lines and the timeout sentences) and the published `proxyClientMaxBodySize` page. All four findings were
confirmed against the sources before editing.

Commands and results (before the recording commit):

| Command | Result |
| --- | --- |
| `git merge origin/feature/import-center` | Merged cleanly (first at `16a4b87`, then again at `301fb74`, which added only a Codex response entry). |
| `git diff --check origin/feature/import-center...HEAD` (run on the merged tree, canonical `301fb74` merged, before this recording commit) | Exit 0, no output. |
| `git diff --name-only origin/feature/import-center...HEAD` | Exactly three paths: `docs/coordination/questions/claude-a.md`, `docs/evidence/webhook-developer-portal-transport-research.md` and `docs/handoffs/webhook-developer-portal-transport-research.md`. |

All eight future-ADR decisions remain unresolved and no policy was added. PR #14 and every other PR were not touched.

### Final check recorded (handoff-only follow-up)

Codex asked for the exact final results because PR #12 carries no comments. After the second canonical merge and
before this recording commit, `git diff --check origin/feature/import-center...HEAD` exited 0 with no output, and
the changed paths were exactly the three listed above. This follow-up changed only this handoff table and the
mailbox status; the evidence note, scope and all unresolved policy decisions are unchanged.
