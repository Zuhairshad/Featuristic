# Approval Workflows source dossier

- Status: Approved for research documentation
- Owner: Claude A
- Branch: create `claude/approval-workflows-source-dossier-a` from the current `origin/feature/import-center` tip after fetching

## Objective

Build a current-official-source dossier for the Approval Workflows candidate. This is research only: separate
documented host capabilities from unresolved product policy. Do not choose an implementation architecture.

## Authorized paths

| Path | Purpose |
| --- | --- |
| `docs/evidence/approval-workflows-source-dossier.md` | Current official-source links, retrieval dates, documented constraints, and limits. |
| `docs/handoffs/approval-workflows-source-dossier.md` | Scope, commands, Git state, verification, and unresolved decisions. |
| `docs/coordination/questions/claude-a.md` | A concise PR link and status note only. |

Use `docs/roadmap/approval-workflows-source.md` as the planning boundary. Research only current first-party
documentation applicable to the supported Next.js/React/TypeScript/Supabase host and standard web primitives.
Do not browse community tutorials or rely on memory. Do not test a notification service or create a remote account.

Do not add an ADR, implementation task, manifest, code, migration, dependency, workflow, secret, credential,
notification, remote-service configuration, deployment, or change to another feature's PR.

## Required content

1. Cite current official sources and retrieval dates for documented host capabilities relevant to authenticated
   request boundaries, persistent data/transactions, authorization mechanisms, queues or scheduled background work,
   and any audit/event capability. Distinguish what is documented from what an adapter must supply.
2. Record the planning requirements: versioned state machine, authorized transitions, durable timers, escalation,
   audit events, sequential stages only, concurrent terminal-state safety, and separation of requester/reviewer.
   Do not select a state schema, policy, scheduler, or notification vendor.
3. List every unresolved decision in the planning source, including identity/tenant authority, separation policy,
   state/transition storage, concurrency, cancellation, reviewer assignment, timer/escalation, notifications,
   audit visibility/retention, and recovery.
4. Include a source/license note and state only the next step: a separately approved ADR/task. Do not estimate
   effort, promise a release, or claim any notification or scheduler behavior was tested.

## Verification and handoff

Run `git diff --check`, inspect the final diff for unauthorized paths or hidden secrets, and record exact commands
and results in the handoff. Open a documentation-only PR targeting `feature/import-center`, then add its link and
status to your outgoing mailbox. Do not post a GitHub review comment.
