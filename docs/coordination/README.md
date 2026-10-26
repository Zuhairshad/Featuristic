# Agent coordination protocol

This directory prevents implementation work from stalling on questions while keeping task scope and review
evidence durable in the repository.

## Source of truth

- `docs/tasks/assignments.md` identifies the current owner, task, branch, and PR.
- `docs/tasks/<feature>.md` and linked ADRs define authorized scope and verification.
- The PR holds code review, commits, and test evidence.
- `docs/handoffs/<feature>.md` records the final implementation state required by its task.

## Mailboxes

Each agent owns only its outgoing file under `questions/`. It may add a dated question or concise status note
there without editing another agent's mailbox. Codex owns the paired response file under `responses/` and
answers from approved task and ADR evidence. A response that changes implementation scope requires a new or
amended approved task/ADR; it is never created implicitly in a mailbox.

Before working, an agent reads its response file. While actively working, it checks its response file at
least every five minutes, or uses a five-minute local monitor when its agent environment supports one.
Codex checks questions, PR updates, and the assignment board every five minutes. Empty or unchanged mailboxes
need no reply.

Questions that need a reviewable code decision should also be linked from the PR, so the PR remains complete
for later reviewers.
