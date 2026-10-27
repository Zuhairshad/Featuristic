# Webhook Developer Portal ADR handoff

- Task: [`docs/tasks/webhook-developer-portal-adr.md`](../tasks/webhook-developer-portal-adr.md)
- Owner: Claude B (Feature 2)
- Branch: `claude/webhook-developer-portal-adr-b`, created from `origin/feature/import-center` at
  `89e59d8ed282408f39073cee2e538049df1a9129`
- Final commit: the head of the pull request. A file cannot contain its own hash; read it from `git log -1` or the PR.
- Status of what was produced: a **Proposed** ADR and a **Proposed** implementation task. Nothing is accepted, and no
  code, migration, outbound request, credential, dependency, or remote service was added or authorized.

## Delivered

| Path | Content |
| --- | --- |
| `docs/adr/0005-webhook-developer-portal.md` | Six decisions (D1 to D6), each with a recommendation, at least one rejected alternative, and residual risk; a security-controls-to-tests table; assumptions to verify; the items that need explicit approval; consequences; sources. |
| `docs/tasks/webhook-developer-portal-implementation.md` | Exact paths, operations, dependencies (none), local Supabase use, prohibited operations, required behavior, the verification commands, a 34-row test matrix (`U1` to `U14`, `D1` to `D10`, `I1` to `I10`), acceptance criteria, stop conditions, and deferred work. |
| `docs/handoffs/webhook-developer-portal-adr.md` | This file. |
| `docs/coordination/questions/claude-b.md` | A concise PR link and status note (added in a later commit, once the PR exists). |

## Decisions in one place

| # | Proposed recommendation | Main rejected alternatives |
| --- | --- | --- |
| D1 | Reuse the Import Center tenant model; tenant-owned endpoints; admin-only; writes through `SECURITY DEFINER` functions; no service role from tenant requests | Per-user ownership; member read access; trusting a client tenant id; service role on behalf of a user |
| D2 | Outbox in the same transaction (trigger on `public.imports`); fan-out at emit time; stable `event_id` and `delivery_id`; append-only attempts; at-least-once and unordered | `pg_net` or Database Webhooks for delivery; emit after commit; worker-side fan-out; FIFO or exactly-once; editing Import Center functions |
| D3 | Vault-stored secret versions; HMAC-SHA256 over `<timestamp>.<event_id>.<raw body>`; show once; 24-hour overlap rotation; allow-listed payloads; no response bodies | Plain-text secrets; hashing; an env-var key; an external KMS; signing inside Postgres (later option); RFC 9421; reveal on demand |
| D4 | HTTPS and port 443 only, DNS names only; `node:https` with a custom `lookup` validating every address once per connection; no redirects; 10 s deadline, 5 s socket timeout, 64 KiB caps; no proxy | Input-string checks; deny-list only; following redirects; a stored resolved address; global `fetch`; `pg_net` or an Edge Function; firewall only |
| D5 | `pgmq` queue plus an operator-authenticated worker route; 6 attempts on a fixed schedule; lease and attempt guards; sweep; replay creates a linked delivery | `after()` or Edge `waitUntil`; `pg_cron` in v1; visibility timeout as the retry clock; unbounded or jittered retries; uncapped `Retry-After`; auto-disable |
| D6 | 30-day delivery and 90-day audit retention (proposed); append-only audit of admin actions, not tamper-proof; local Supabase only; no new dependencies | Indefinite retention; automatic purge; same-transaction denial rows; a tamper-proof claim; `pgAudit` as the admin trail |

## Things the reviewer must know

1. **Hard precondition.** The Import Center implementation (tenancy, local Supabase config, `pgmq` pattern, worker
   endpoint pattern) is on PR #1 and is **not on `feature/import-center`**. The ADR and the task both state that the
   implementation cannot begin until PR #1 is merged. If PR #1 does not merge, D1 and D5 must be re-opened.
2. **Research PRs are unmerged.** The dossier (PR #11, head `20ff1d9`) and the transport note (PR #12, head `99bba22`)
   are cited as plain-text references with short ids, not links, because their files are not on this branch.
3. **Event source is coupled to the Import Center.** The only domain events in the reference host are
   `import.completed` and `import.failed`, so the fixed catalog is those two plus `webhook.test`, emitted by a trigger
   on `public.imports` in a new migration. That couples the webhook migration to the `public.imports` schema.
4. **Seven assumptions are not yet proven** and are listed in the ADR with tests that settle them: the Vault extension
   locally, a trigger in the updating transaction and able to raise, a `pgmq.send` delay, `https.request` honoring a
   custom `lookup` for the connection, per-option Node "Added in" versions, the IANA registries, and pinned-version
   behavior. The task has a stop condition for each.
5. **Egress is a best-effort control.** The ADR says so and recommends network-level egress controls for any real
   deployment. It makes no claim that SSRF is eliminated.
6. **The audit trail is not tamper-proof**, and denied attempts leave no audit row in v1.
7. **Numbers are proposals.** Attempt counts, delays, deadlines, caps, retention periods, the 300-second timestamp
   tolerance, and the replay limits need explicit approval (ADR table "Items that need explicit approval").

## Sources and their limits

- Used as accepted: the planning source and the final review on `feature/import-center`; the dossier (PR #11) and the
  transport note (PR #12) at the heads above.
- Re-read for this ADR on 2026-10-27, opened directly on `nodejs.org`: the `http`, `https`, and `tls` pages (the
  `http.request()` `lookup`, `agent`, `signal`, `timeout` options; `https.request()` accepting all `http.request()` options
  plus `rejectUnauthorized` and `servername`; `rejectUnauthorized` default `true`).
- Also used, read earlier the same day as publisher documentation source in a separate research task: the PostgreSQL
  INSERT page (for `ON CONFLICT DO NOTHING`) and the Supabase pgAudit page.
- `nextjs.org`, `supabase.com`, `www.postgresql.org`, and the IETF and IANA hosts did not resolve, so facts cited by
  short id rest on the accepted records, which read publisher documentation source from public repositories.
- The "Added in" version of the `http.request` `lookup` option was not shown by the page and is an assumption.
- No community source, real endpoint, local Supabase stack, receiver, or CI check was used or run. Documentation license
  terms are unreviewed and the human legal-review gate remains open.

## Verification

| Command | Result |
| --- | --- |
| `git fetch origin` | Canonical tip `89e59d8ed282408f39073cee2e538049df1a9129`. |
| `git diff --check` on the staged files, before committing | Exit 0, no whitespace errors. |
| `git diff --cached --name-only` searched for `.github/`, `*.yml`/`*.yaml`, lockfiles, `package.json`, source extensions | No matches. |
| `git diff --cached` searched for key-shaped strings (`sk-`, `ghp_`, `github_pat_`, `AKIA`, private-key headers, JWT-like) | One match: this table's own list of the patterns searched. No key, token, or secret value. |
| `git diff --check origin/feature/import-center...HEAD` after the final commit | Exit 0 (stated in the PR description). |

Nothing was executed against Supabase, GitHub Actions, or any endpoint.

## Review request

Please review ADR 0005 and the implementation task before any implementation begins. The decisions that most need a
human call are: whether to require PR #1 merged first, the proposed numeric limits, Vault as the secret store, and the
fixed three-event catalog. I stopped after publishing the proposal, as the task directs.

## Git state

- Base: `origin/feature/import-center` at `89e59d8ed282408f39073cee2e538049df1a9129`.
- This branch changes the four paths above only. No GitHub review comment was posted, nothing was merged, and no other
  PR or branch was modified.
