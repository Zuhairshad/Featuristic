# ADR 0004: Import Center final-review refinements

- Status: Accepted
- Date: 2026-10-27
- Supersedes: the duplicate-key and interruption details of ADR 0002 where they conflict

## Context

Independent final review of PR #1 found that a dedupe key made from selected values alone can collide when
different imports select different target fields, and that a stale queued/running import can be replayed by the
database but not by the UI. The review also identified bounded hardening gaps around stored mappings, requested
tenant selection, queue acknowledgement, operator-secret strength, and row-number wording.

## Decision

1. The v1 duplicate key remains tenant-scoped but is **namespaced by mapped target-field names**. Construct it
   from sorted `[targetField, normalizedValue]` pairs for the selected key columns. Mapping order must not alter
   the key. Two imports selecting different target fields with the same values are not duplicates.
2. An interrupted import is recoverable. Before archiving an exhausted or permanent-failure queue message, the
   worker records the failed import state. A tenant admin can replay a `failed` import and a `queued` or `running`
   import whose heartbeat is stale for five minutes. The UI must expose this recovery state without exposing a
   service credential or another tenant's data.
3. The worker validates its persisted mapping before processing. A supplied tenant that the caller does not
   administer is rejected rather than silently falling back to another tenant. Queue-acknowledgement failure is
   recorded separately from a failed import batch. A configured worker secret shorter than 32 characters leaves
   the operator endpoint disabled. UI and downloadable-error wording identifies row numbers as data rows when
   blank lines are ignored.

PR #1 is unmerged, so this task may amend its existing local fixture migration rather than create a compatibility
migration for deployed data. No remote database operation is authorized.

## Consequences

- Preview, worker, database uniqueness and tests must share one canonical duplicate-key algorithm.
- Interrupted jobs become visibly and testably recoverable through the admin UI.
- The accepted scope remains a local reference host; no installer, hosted Supabase, scheduler, webhook, or
  production credential work is introduced.
