# Approval Workflows research source

> Status: **research evidence, not approval.** This record does not authorize an Approval Workflows ADR, task for
> implementation, migration, dependency, notification, scheduler, credential, or remote-service configuration.

## Source boundary

This factual extract was read from *FeatureKit / Revised Research / v0.2*, printed page 26, on 27 October 2026.
The PDF remains an untracked local planning reference. The candidate-source extract corroborates that this is package
3, a `launch` candidate, and that its stated dependencies are identity, permissions, a durable scheduler, and
notifications.

## Directly supported package facts

| Topic | Research evidence |
| --- | --- |
| Stage and outcome | Package 3 is a **launch** candidate. Users submit requests, assign reviewers, comment, approve or reject, receive reminders, and inspect history. |
| Frontend deliverables | Reviewer inbox, request detail, stage editor, and timeline. |
| Backend deliverables | Versioned state machine, authorized transitions, durable timers, escalation, and audit events. |
| Bounded first release | Sequential stages first; no arbitrary user code or unrestricted visual programming. |
| Critical verification | Concurrent approval and cancellation produce one valid terminal state; a requester cannot self-approve under the separation policy. |
| Declared dependencies | Identity, permissions, durable scheduler, and notifications. |
| Candidate condition | The package remains a candidate until it has a migration/effect plan, exact-commit evidence, operational instructions, update/removal behavior, and the wider evidence gates. |

## Explicitly unresolved

The planning reference does not choose the identity or tenant model, separation-of-duties policy, state/transition
storage, concurrency control, timer/scheduler adapter, escalation/reminder behavior, notification adapter,
authorization model, audit retention/visibility, reviewer assignment rules, cancellation policy, or recovery model.
A future approved ADR and task must decide these from current official sources and the supported host's actual
bindings; none may be inferred from this record.

## Current repository boundary

Import Center remains the only implemented reference-host feature. Webhook Developer Portal has accepted research
evidence only. No Approval Workflows implementation, local provisioning, remote service, credential, or workflow is
approved.
