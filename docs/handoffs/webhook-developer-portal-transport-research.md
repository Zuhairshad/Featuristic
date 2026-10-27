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
| Compare the repository's Node range (`>=22.12.0`) with the documented version (Node.js v26.12.1) | Only APIs added long before v22 are cited; the skew is stated in the note for the ADR author to re-check. |
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
