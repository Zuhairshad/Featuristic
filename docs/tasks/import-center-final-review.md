# Import Center final code review

- Status: Approved for independent review
- Owner: Claude B
- Branch: create `claude/import-center-final-review-b` from the current `origin/feature/import-center` tip after fetching

## Objective

Perform an independent static review of PR #1 (`claude/busy-newton-mx3fgc` into `feature/import-center`) after
the reported security fixes and first-run inspector repair. Produce a durable final-review handoff. This task
does not authorize source changes, a merge, a deployment, a remote database command, or a claim that unrun
checks passed.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/handoffs/import-center-final-review.md` | Review scope, verified evidence, remaining gaps, verdict, and exact required corrections if any. |
| `docs/coordination/questions/claude-b.md` | A concise PR link and verdict status note only. |

Do not modify PR #1, fixture code, migrations, dependencies, tests, contracts, manifests, task/ADR decisions,
another agent's mailbox, or GitHub configuration. Use only the accepted task, ADR 0002, current PR #1 source
and committed test evidence. No external network delivery or database target is authorized.

## Required review focus

1. Tenant isolation: confirm no tenant-facing route or Server Action can invoke the service-role queue worker,
   and every import/replay/error/download path retains tenant-admin authorization.
2. Request boundaries: confirm upload and JSON request bodies have bounded pre-parse reads and do not trust a
   client `Content-Length` alone.
3. Import correctness: review tenant-scoped normalized duplicate keys, preview/persisted parity, bounded queue
   processing, cursor/replay behavior, and immutable imported records.
4. Data safety: review Storage visibility, secret handling, error response exposure, and formula-safe CSV error
   output.
5. Setup and evidence: inspect the first-run `inspect:fixture` repair and distinguish source/test evidence from
   unverified browser, CI, and environment-dependent claims.

For every finding, name the file, exact impact, and required correction. A clean review must still list the
unverified browser/CI limits and any tests not personally run.

## Verification and handoff

Run `git diff --check origin/feature/import-center...origin/claude/busy-newton-mx3fgc`, inspect the full PR #1
diff, and record the exact base/head commits and commands in the handoff. Open a documentation-only PR targeting
`feature/import-center`, then add its link and verdict to your own outgoing-question mailbox. Do not post a
GitHub review or modify another agent's mailbox.
