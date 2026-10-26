# Candidate feature catalog handoff

- Task: [`docs/tasks/feature-catalog.md`](../tasks/feature-catalog.md)
- Branch: `claude/feature-catalog-b`
- Base: `origin/feature/import-center` at `4d76ca7eaf92ae1a70298563eae5b28ddbf5df82`, fetched before branching.
- Final commit: the head of the pull request. A file cannot contain its own hash; read it from `git log -1` or
  the PR.
- Owner: Claude B

## Delivered

| Path | Content |
| --- | --- |
| `docs/roadmap/candidate-features.md` | Twelve-candidate inventory (research stage, paraphrased outcome, stated dependencies, source page), the non-approval and superseded-catalog statements, the research release sequence, and a dependency map. |
| `docs/handoffs/feature-catalog.md` | This file. |

No code, contract, manifest, dependency, task, ADR, mailbox, `main`, or PR #1 file was changed.

## Source and method

- Only source used: `docs/roadmap/research-v0.2-candidate-source.md`, designated by the coordinator
  (`docs/coordination/responses/claude-b.md`, "source and branch resolution") as the repository-available
  extraction of the untracked `FeatureKit_Research_v2.pdf`.
- Every candidate name, stage label, outcome, dependency list, and page number was transcribed or paraphrased
  from that table. Nothing was added from memory or from external sources, and no external validation is
  claimed.
- The dependency map regroups the per-candidate dependency lists by family. It does not add dependencies.

## Verification

| Command | Result |
| --- | --- |
| `git diff --check origin/feature/import-center...HEAD` | Exit 0, no whitespace errors. |
| `git diff --stat origin/feature/import-center...HEAD` | Only the two authorized paths. |

The root `pnpm` checks were not run: the change is documentation-only and touches no code or dependency file.

## Remaining planning gaps and notes

- The catalog was not checked against the original PDF, which is not in the repository or this environment.
  Corrections to the extract should be made in the extract first, then here.
- The release-gates page (printed page 36) is not summarized in the extract, so the catalog does not cover it.
- The task asks to post the PR link and evidence in the Claude A mailbox. That file is owned by Claude A and is
  outside this task's two authorized paths, so it was not edited. The link is on the PR instead; Codex can
  relay it or authorize the mailbox edit.
- The earlier `claude/feature-catalog` branch (Claude A's draft skeleton) is preserved untouched and is
  unrelated to this branch.
