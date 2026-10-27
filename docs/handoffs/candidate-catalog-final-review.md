# Candidate catalog final review

- Task: [`docs/tasks/candidate-catalog-final-review.md`](../tasks/candidate-catalog-final-review.md)
- Reviewer: Claude A
- Subject: PR #2, `claude/feature-catalog-b` into `feature/import-center`, author Claude B
- Reviewed PR #2 head: `82433be40d4f7c2e900a6a0af2736275098ac804`; correction commit
  `94740e3a690f026dc26b61eb44c904165d7db84b`; earlier reviewed head `eca2a48f0b0d1293e2a49d6892312202e0b8c42a`
- PR #2 base: `4d76ca7eaf92ae1a70298563eae5b28ddbf5df82`
- Canonical tip when this review branch was created: `6852679`
- Review branch: `claude/candidate-catalog-final-review-a`, created from that tip
- Sources used: `docs/roadmap/research-v0.2-candidate-source.md` (sole planning source), the original catalog
  task, `docs/tasks/candidate-catalog-corrections.md`, my earlier review handoff (`docs/handoffs/feature-catalog-review.md`
  on `claude/candidate-catalog-review-a`) and the PR #2 diff. The untracked PDF was not used. No file of PR #2 or
  any other branch was changed and no GitHub review was posted.

## Verdict: ACCEPT

PR #2's catalog is a faithful planning inventory of the source extract. The two unsupported attributions found in
my first review (F1, F2) were replaced with exactly the specified wording, and nothing supported was changed. I
have no required corrections. Two optional notes from the first review remain unapplied and are non-blocking.

This verdict is limited to the catalog being accurate against the extract. It cannot detect an error in the
extract itself, and it approves no candidate feature.

## Required review focus: results

### 1. Scope of PR #2

| Check | Result |
| --- | --- |
| `git diff --check origin/feature/import-center...origin/claude/feature-catalog-b` | Exit 0. |
| `git diff --name-status` (three-dot) | `docs/handoffs/feature-catalog.md` (A) and `docs/roadmap/candidate-features.md` (A) only. |
| `git log --oneline origin/feature/import-center..origin/claude/feature-catalog-b` | Three commits: `eca2a48` (catalog), `94740e3` (F1, F2 corrections), `82433be` (handoff record). |
| Code, workflow, secret, dependency, task or ADR changes | None. `.github/` path count on the PR head is `0`; added lines contain no key-shaped strings. |
| Relation to canonical | PR #2 is behind the tip by documentation-only coordination commits (ADR 0004, tasks, response files). None touches PR #2's two paths, so there is no overlap. The branch was intentionally not merged, as the correction task directs. |

### 2. Reconciliation with the source extract

| Check | Method | Result |
| --- | --- | --- |
| Twelve candidate rows | Parsed both tables from the committed files and compared every cell (number, name, stage, outcome, dependencies, page) | 12 rows in each, **0 mismatches** over 72 cells. |
| Names and research stages | Included in the cell comparison | Identical (flagship, launch, launch, expansion x5, later, domain-specific, later, supporting package). |
| Page references | Included in the cell comparison | 24 through 35 in order; release gates on 36, as the extract states. |
| Release order | Read | Data Import Center, Webhook Developer Portal, Approval Workflows, labeled research sequencing only. No estimate or promotion. |
| Dependency-map entries | Each of the 28 entries in the grouping table checked against the per-candidate lists | **28 of 28 supported**, no invented dependency. The statement that nine of twelve candidates state a queue, jobs or scheduler dependency is correct (candidates 1, 2, 3, 4, 5, 7, 8, 10, 12). |
| Candidate-only status | Read | Present: all twelve are candidates pending behavior contracts, dossiers, implementation, verification and lifecycle evidence. |

### 3. F1 and F2 corrections

`git diff eca2a48 94740e3 -- docs/roadmap/candidate-features.md` changes only the "Reading the map" bullets.

| Finding | Result |
| --- | --- |
| F1 (job-primitive rationale) | Replaced with: the family is "the most widely stated dependency in the per-candidate lists (nine of twelve candidates). The source extract states that the research treats job primitives as shared dependencies; it does not state why." This is my specified text, verbatim. The unsupported "which is why the research..." is gone. |
| F2 (audit-primitive mapping) | Replaced with: the audit primitive "is named in the research as a shared dependency. The source extract does not say which per-candidate dependency entries correspond to it, so this catalog does not map or infer any." Also verbatim. The mapping onto candidates 12 and 7 is gone. |
| Supported facts unchanged | The candidate table, grouping table, release sequence, the provider bullet and the status section are byte-identical between `eca2a48` and `94740e3`. |
| PR #2 handoff | The added "Review follow-up" section records the review link, reviewed and correction commits, the verbatim-text statement, and four verification commands; I reran the equivalents and the results match. |

### 4. Required statements

| Statement | Result |
| --- | --- |
| The former 150-feature catalog is superseded and must not be represented as supported | Present in "Status of this document". |
| Only Import Center has an approved implementation task | Present, linking `docs/tasks/import-center.md` and ADR 0002. Still true at the current tip: the new `webhook-developer-portal-source-extract.md` task is research-only and says it approves no implementation. |
| Job and audit primitives are research dependencies, not implemented capabilities | Present: "None of the following exists as a FeatureKit platform capability today." Header reads "research dependencies, not implemented capabilities". |

## Optional notes (not required for acceptance)

- **O1 (carried over).** `docs/roadmap/candidate-features.md`, provider bullet: the clause "depend on integrations
  the repository has no task for" is a statement about the repository, not the source. It is true today. A cleaner
  form is to end with "No repository task exists for any candidate other than Import Center."
- **O2 (carried over, now more relevant).** `docs/roadmap/candidate-features.md` line 56 says the Import Center
  queue is "scoped to that fixture and still in review". That will be stale once PR #1 is merged. A form that does
  not age: "scoped to that fixture; it is not an extracted platform primitive."

Neither changes a supported fact. The correction task correctly left both unapplied.

## What I ran

| Command or action | Result |
| --- | --- |
| `git fetch origin` | Canonical tip `6852679`; PR #2 head `82433be`. |
| `git diff --check origin/feature/import-center...origin/claude/feature-catalog-b` | Exit 0. |
| `git diff --name-status` and `git log --oneline` for the same range | Two docs paths; three commits. |
| Script: parse both tables, compare 72 cells | 12 rows, 0 mismatches. |
| Script: check the 28 dependency-map entries against the extract | 28 of 28 supported. |
| `git diff eca2a48 94740e3 -- docs/roadmap/candidate-features.md` and `git diff eca2a48 82433be -- docs/handoffs/feature-catalog.md` | Only the two specified bullet replacements and the handoff follow-up section. |
| Search of added lines for key-shaped strings; count of `.github/` paths on the PR head | None; `0`. |

## Not verified

- The extract itself against the original PDF (the PDF was not available and the task forbids using it).
- The release-gates page (36) content: the extract does not summarize it, so neither does the catalog.
- Any external fact about the candidates; none is represented in the catalog.

## Git state

- Base: `origin/feature/import-center` at `6852679`.
- This branch adds this file and a status entry in `docs/coordination/questions/claude-a.md`. Read the final head
  from `git log -1` or the PR; a file cannot contain its own hash.
- PR #2, PR #1, the source extract, the catalog and every other mailbox were not changed. Nothing was merged.
