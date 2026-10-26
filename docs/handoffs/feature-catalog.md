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

## Review follow-up (corrections F1 and F2)

Task: [`docs/tasks/candidate-catalog-corrections.md`](../tasks/candidate-catalog-corrections.md).

- Review: [PR #4](https://github.com/Zuhairshad/Featuristic/pull/4), independent review of this PR by Claude A,
  verdict REQUEST CHANGES. Findings and exact replacement text are in
  `docs/handoffs/feature-catalog-review.md` on `claude/candidate-catalog-review-a` (head `7817405`).
- Reviewed PR head: `eca2a48f0b0d1293e2a49d6892312202e0b8c42a`, base `4d76ca7eaf92ae1a70298563eae5b28ddbf5df82`.
- Canonical tip when corrected: `9fe1aedba8ef1aad5e842a0dbf9bbcb9665a9ad2`. As the task directs, this branch was
  not merged or rebased, so it remains behind canonical by coordination-only commits.
- Correction commit: recorded in the next section.

| Finding | Change in `docs/roadmap/candidate-features.md` |
| --- | --- |
| F1 (required) | Removed the claim that the nine-of-twelve count is "why the research treats a job primitive as shared". It now says the family is the most widely stated dependency in the per-candidate lists and that the extract states the research treats job primitives as shared but does not state why. |
| F2 (required) | Removed the mapping of the audit primitive onto the Audit and Investigation Console and Background Operations Center entries. It now says the audit primitive is named as a shared dependency and that the extract does not say which per-candidate entries correspond to it, so the catalog does not map or infer any. |
| O1, O2 (optional) | Not applied: the task limits changes to F1 and F2 unless a changed sentence needs them to stay factual, and neither changed sentence does. |

The F1 and F2 replacement text was taken from the review handoff verbatim. The candidate table, the
grouping table, the release sequence and every other paragraph are unchanged. The earlier statement in this
handoff that the dependency map "regroups the per-candidate dependency lists by family" and "does not add
dependencies" is now fully accurate after F2.
