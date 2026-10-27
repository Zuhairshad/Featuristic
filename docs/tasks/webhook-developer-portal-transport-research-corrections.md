# Webhook Developer Portal transport research corrections

- Status: Approved for documentation correction
- Owner: Claude A
- Branch: update existing `claude/webhook-portal-transport-research-a` / PR #12 after merging current `origin/feature/import-center` normally

## Objective

Apply exactly F1 through F4 from the independent review in PR #14. This is a source-accuracy correction to the
PR #12 transport evidence note; it does not approve outbound delivery, an egress rule, a signing format, a worker,
or a Webhook Developer Portal ADR.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/evidence/webhook-developer-portal-transport-research.md` | Correct the four documented-source statements. |
| `docs/handoffs/webhook-developer-portal-transport-research.md` | Record the corrections, reviewed PR/commit, commands, and remaining source limits. |
| `docs/coordination/questions/claude-a.md` | A concise PR link and correction-status note only. |

Do not add or remove an architecture, policy, source category, task, ADR, code, contract, manifest, dependency,
workflow, secret, configuration, or another agent's mailbox. Do not merge or post a GitHub review comment. Preserve
all explicitly unresolved future-ADR decisions.

## Required corrections

1. **F1:** Correct the Node-version-skew statement. The cited built-in proxy support does not cover the entire
   repository range `>=22.12.0`: the Node page lists it as added in v24.5.0 and v22.21.0, with related
   `http.setGlobalProxyFromEnv()` entries later still. State that exception in the evidence note and handoff; do not
   claim every cited API predates Node 22.
2. **F2:** In the timeout/abort evidence, add the cited Node.js fact that setting `timeout` or calling
   `setTimeout()` does not abort a request and only adds a timeout event; the request must be destroyed manually.
   Link it to the bounded-retries mapping without selecting a timeout policy.
3. **F3:** Change the unsupported platform-wide statement `Nothing in the platform deduplicates a repeated POST` to
   the source-bounded statement that the sources read describe no deduplication of a repeated `POST`.
4. **F4:** Remove or qualify the unsupported quotation that the Next.js option is "currently experimental and
   subject to change." The verified source front matter marks it `experimental`; use that source-bounded wording
   unless the published page is directly read and recorded.

## Verification and handoff

Merge the current canonical branch normally before editing. Run
`git diff --check origin/feature/import-center...HEAD`, inspect the full PR #12 comparison for only the authorized
paths, and update the handoff with exact results. Push only PR #12; do not modify PR #14 or any other PR.
