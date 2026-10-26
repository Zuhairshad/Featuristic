# Candidate catalog review handoff

- Task: [`docs/tasks/candidate-catalog-review.md`](../tasks/candidate-catalog-review.md)
- Reviewer: Claude A
- Subject: PR #2, `claude/feature-catalog-b` into `feature/import-center`, author Claude B
- Review branch: `claude/candidate-catalog-review-a`, created from `origin/feature/import-center` at `595b7f8`

## Verdict: REQUEST CHANGES

The inventory itself is correct. All twelve candidates match the source extract exactly, and the required
statements are present. Two sentences in the dependency-map commentary attribute reasoning to "the research"
that the source extract does not contain, and the task forbids adding facts beyond the extract. Both fixes are
small, local to one file, and listed below with the exact replacement text. Two further optional notes are
non-blocking.

## Reviewed state

| Item | Value |
| --- | --- |
| PR #2 head (reviewed) | `eca2a48f0b0d1293e2a49d6892312202e0b8c42a` (one commit, "docs(roadmap): add candidate feature catalog") |
| PR #2 base | `4d76ca7eaf92ae1a70298563eae5b28ddbf5df82` on `feature/import-center` |
| Canonical tip at review | `595b7f8e878a6d516ace9a0d1333f72bbd16c7d6` |
| PR #2 relative to the tip | one commit behind (`595b7f8`, documentation only: assignment board, mailbox responses, two task documents). It changes neither of PR #2's files, so the branch merges without overlap. When PR #2 was opened (20:43Z) its base `4d76ca7` (committed 20:39Z) was the canonical tip, so it was current when branched. |
| Reference documents | `docs/tasks/feature-catalog.md` and `docs/roadmap/research-v0.2-candidate-source.md`, read from the canonical tip. Neither changed between `4d76ca7` and `595b7f8`. |

The original PDF was not used, as the task requires. The extract is treated as the sole source of truth. This
review cannot detect an error in the extract itself.

## Requirement 1: scope and base

| Check | Result |
| --- | --- |
| PR contains only the two paths authorized by `feature-catalog.md` | **Pass.** `git diff --name-only 4d76ca7 origin/claude/feature-catalog-b` lists exactly `docs/handoffs/feature-catalog.md` and `docs/roadmap/candidate-features.md`. The PR API reports 2 changed files. |
| No code, contract, manifest, dependency, task, ADR, mailbox, `main` or PR #1 change | **Pass.** Nothing else is in the diff. |
| Based on the current canonical branch | **Pass, with a note.** Current when branched; now one documentation-only commit behind with no path overlap (see above). |
| Whitespace | **Pass.** `git diff --check origin/feature/import-center...origin/claude/feature-catalog-b` exits 0. |

## Requirement 2: comparison with the source extract

Method: both tables were parsed from the files at the commits above and compared cell by cell with a script;
no field was judged by eye.

| Check | Result |
| --- | --- |
| Rows | 12 in the PR, 12 in the extract |
| Fields compared per row | number, candidate, research stage, user outcome, stated dependencies, source page (72 cells) |
| Mismatches | **0** |
| Candidate names against the names in `feature-catalog.md` | All twelve appear in the task text in the same order and spelling, and equal the PR's names. No candidate is missing, added or renamed. |
| Research stage labels | Identical to the extract: flagship, launch, launch, expansion (five), later, domain-specific, later, supporting package. |
| Page locations | 24 through 35, one per candidate, plus release gates on 36, as the extract states. |
| Release order | Import Center first, Webhook Developer Portal second, Approval Workflows third. No later candidate promoted and no estimate given. |
| Outcome wording | The PR's outcome cells equal the extract's "paraphrased" column verbatim. The extract is already a paraphrase of the PDF, so this does not breach the task's "quote no more than a short phrase" limit. |

## Requirement 3: required statements

| Statement | Result |
| --- | --- |
| The former 150-feature catalog is superseded | Present ("The former 150-feature catalog is **superseded**. It must not be represented as supported."), consistent with the extract. |
| This is a candidate inventory | Present, and the research's pending items match the extract's list. |
| Only Import Center has an approved implementation task | Present, with links to `docs/tasks/import-center.md` and ADR 0002. |
| Shared job and audit items are not implemented platform capabilities | Present ("None of the following exists as a FeatureKit platform capability today"). See F1 and F2 for two sentences that go beyond the source. |

Dependency map: all 28 entries in the grouping table were checked against the per-candidate dependency lists
in the extract. **All 28 are supported.** The claim that nine of twelve candidates state a queue, jobs or
scheduler dependency is correct (candidates 1, 2, 3, 4, 5, 7, 8, 10, 12).

## Findings

### F1 (required): rationale attributed to the research that the extract does not state

- File: `docs/roadmap/candidate-features.md`, lines 72–73.
- Current text: "The queue/jobs/scheduler family is the most widely stated dependency (nine of twelve candidates), which is
  why the research treats a job primitive as shared."
- Problem: the extract says only that the research "identifies audit and job primitives as shared dependencies
  rather than headline features". It gives no reason. "Which is why the research ..." is the author's inference
  presented as the research's reasoning.
- Exact correction: replace the two lines with
  "- The queue/jobs/scheduler family is the most widely stated dependency in the per-candidate lists (nine of
  twelve candidates). The source extract states that the research treats job primitives as shared dependencies;
  it does not state why."

### F2 (required): the audit primitive is mapped to specific dependency entries the extract does not map

- File: `docs/roadmap/candidate-features.md`, lines 74–77.
- Current text: "The audit primitive is named in the research as shared. In the per-candidate lists above it appears most
  directly as the durable event sink and actor context of the Audit and Investigation Console (candidate 12),
  and as logs, durable state, and actor/tenant context for the Background Operations Center (candidate 7). This
  catalog does not infer further audit dependencies that the source does not state."
- Problem: the first sentence is supported. The second and third state which listed dependencies "are" the audit
  primitive, and the extract does not make that identification. The closing sentence ("does not infer *further* audit
  dependencies") implies that the preceding mapping is itself an inference.
- Exact correction: replace the four lines with
  "- The audit primitive is named in the research as a shared dependency. The source extract does not say which
  per-candidate dependency entries correspond to it, so this catalog does not map or infer any."

### O1 (optional, non-blocking): a statement about the repository sits beside source claims

- File: `docs/roadmap/candidate-features.md`, lines 78–79.
- Current text ends: "... depend on integrations the repository has no task for."
- Observation: the four provider dependencies are correctly listed from the extract. The final clause is a claim
  about the repository, not the source. It is true today but is not marked as such.
- Suggested correction: end the bullet with "... state an external-provider dependency. No repository task exists
  for any candidate other than Import Center."

### O2 (optional, non-blocking): time-sensitive wording

- File: `docs/roadmap/candidate-features.md`, lines 55–56.
- Current text: "... scoped to that fixture and still in review; ..."
- Observation: "still in review" was true while PR #1 was open and will become stale.
- Suggested correction: "ADR 0002 specifies a queue for the Import Center reference host, scoped to that
  fixture; it is not an extracted platform primitive."

### Observation (no change needed)

Candidate 9 lists an "enterprise identity provider" and is not in the "Actor, tenant, or identity context"
family. That is a reasonable grouping choice, and the provider-dependency bullet covers it.

## Handoff file of PR #2

`docs/handoffs/feature-catalog.md` needs no correction. Its base commit, method, verification result and gaps
match what was reproduced here. It states that the dependency map regroups the per-candidate lists without
adding dependencies; that sentence becomes fully accurate once F2 is applied. It also states, correctly, that
the coordinator designated the extract (`docs/coordination/responses/claude-b.md`, "source and branch
resolution", present at that heading).

## Commands run

| Command | Result |
| --- | --- |
| `git fetch origin` | Canonical tip `595b7f8`. |
| `git merge-base origin/claude/feature-catalog-b origin/feature/import-center` | `4d76ca7`. |
| `git diff --stat origin/feature/import-center...origin/claude/feature-catalog-b` | Two files, 133 insertions. |
| `git diff --name-only 4d76ca7 origin/claude/feature-catalog-b` | The two authorized paths only. |
| `git diff --check origin/feature/import-center...origin/claude/feature-catalog-b` | Exit 0. |
| `git diff --name-only 4d76ca7 origin/feature/import-center` | Five documentation files; no overlap with PR #2 paths. |
| Script: parse both tables from the committed files and compare cell by cell | 12 rows, 0 mismatches in 72 cells. |
| Script: check the 28 dependency-map entries against the extract | 28 of 28 supported; nine of twelve confirmed. |
| `git diff --check origin/feature/import-center...HEAD` (this branch) | Exit 0 (run before commit and again after). |

## Limits

- Not checked against the original PDF, per the task. Any error in the extract passes through unnoticed.
- The release-gates page (36) is not summarized in the extract, so neither the catalog nor this review covers it.
- No GitHub review or comment was posted on PR #2, per the task. The verdict and the link to this review's PR
  are in the Claude A mailbox.
- PR #1, PR #2 and their branches were not modified. No candidate was approved, scheduled or estimated.
