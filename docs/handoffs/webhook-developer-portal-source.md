# Webhook Developer Portal source extract: status handoff (blocked)

- Task: [`docs/tasks/webhook-developer-portal-source-extract.md`](../tasks/webhook-developer-portal-source-extract.md)
- Owner: Claude B
- Branch: `claude/webhook-portal-source-extract-b`, created from `origin/feature/import-center` at
  `6db25a629ec581dcb9cebd46718641e4ae691d2e`
- Final commit: the head of the pull request. A file cannot contain its own hash; read it from `git log -1` or the PR.

## Status: BLOCKED. The required extract was not produced.

This is **research evidence tooling, not approval**, and it is a status handoff only. The task requires a
page-cited extract from `FeatureKit_Research_v2.pdf` and `FeatureKit_Workflow_v2.pdf`. Neither file is readable
from this session, so no PDF-derived claim is made here, and the planned
`docs/roadmap/webhook-developer-portal-source.md` was **not** created. Following the coordinator's instruction for
this case, this PR contains only this handoff and a mailbox note.

## Blocker, with the commands that show it

| Command | Result |
| --- | --- |
| `find / \( -iname "*FeatureKit*" -o -iname "*Research_v2*" -o -iname "*Workflow_v2*" \) -not -path "*/node_modules/*" -not -path "*/.git/*"` (excluding `/proc` and `/sys`) | No PDF. The only matches are the repository's own `docs/adr/0001-initial-featurekit-foundation.md` and copies of it in this session's scratch exports. |
| `find / -iname "*.pdf"` (excluding `/proc`, `/sys`, `/usr`, `/opt`, `node_modules`) | One file, `/mnt/skills/examples/theme-factory/theme-showcase.pdf`, which is unrelated to FeatureKit and was not opened. |
| `git ls-tree -r --name-only <ref> \| grep -iE "\.pdf$"` over every `origin/*` branch | No PDF on any branch. |
| `ls` of `/root/uploads`, `/tmp/uploads`, `/workspace` | Directories do not exist. |

`docs/handoffs/bootstrap.md` already records that the planning PDFs "remain untracked and are intentionally
excluded", so they exist only on the machine that produced them. This session runs in a cloud checkout and
cannot read that machine.

I did not reconstruct page numbers, user outcomes, dependencies, roles, or delivery, retry, replay or secret
behavior from memory and present them as research evidence. I also did not browse, because the task forbids it.

## What the repository already states (corroboration only)

The task allows the repository source extract to corroborate the candidate name, sequence and stated dependency
list. These facts come from `docs/roadmap/research-v0.2-candidate-source.md` at the base commit, which is itself a
paraphrased extract of the PDF, and **not** from the PDFs. They do not satisfy the task's required content.

| Item | Value in the repository extract |
| --- | --- |
| Candidate | Webhook Developer Portal |
| Research stage label | launch |
| User outcome (paraphrased in the extract) | Register endpoints, choose events, rotate secrets, inspect delivery attempts, and replay failures. |
| Stated dependencies | Queue; outbound networking; secrets; transactional event source. |
| Source page in the extract | 25 |
| Research release sequence | Data Import Center first, Webhook Developer Portal second, Approval Workflows third. |

## Unresolved items (not supplied here, and no default is chosen)

The task asks that every missing decision be recorded as **unresolved** rather than defaulted. Because the PDFs were
not read, none of the following is determined by evidence in this handoff. Each may or may not be answered by the
PDFs, and a later pass with the PDFs must check:

- Tenant model and who may manage endpoints.
- Event source: what the "transactional event source" is, and its delivery guarantee.
- Storage of endpoints, secrets and delivery attempts.
- Retry policy, backoff and limits.
- Delivery authentication and signing, and how secret rotation works.
- Replay authorization and the operator workflow.
- Any named roles, explicit constraints, or stated delivery, replay or secret behavior.

## Conflict with accepted repository scope

The accepted repository documents already place webhook work outside the current approved scope, and they prevail
over any research statement:

- `docs/tasks/import-center.md` says not to implement webhooks (line 25) and lists webhook delivery among work that
  "require[s] a separate approved task and ADR" (line 67).
- `docs/adr/0002-import-center-reference-host.md` states that `feature/webhook-portal` and all webhook delivery
  work are outside the Import Center task (line 15).
- No webhook implementation task or ADR is approved today.

No conflict with the PDFs could be assessed, since the PDFs were not read.

## Proposed next planning step only

Make the PDFs available to this task, then re-run it. Either of these needs the coordinator to name a path and
authorize it, because the task's authorized paths do not cover storing source material:

1. Commit a plain-text extraction of the Webhook Developer Portal sections (page 25 and any related pages in
   either PDF, including the workflow PDF) at a named path, or
2. Authorize committing the PDFs themselves at a named path.

After the extract exists, any implementation still needs a future approved ADR and task. No effort estimate or
delivery date is given or implied.

## Verification

| Command | Result |
| --- | --- |
| `git fetch origin` | Canonical tip `6db25a629ec581dcb9cebd46718641e4ae691d2e`. |
| `git diff --check` on the staged handoff, before committing | Exit 0, no whitespace errors. |
| `git diff --check origin/feature/import-center...HEAD` after committing | Exit 0 (re-run after the final commit; stated in the PR description). |

The changed paths are limited to this file and `docs/coordination/questions/claude-b.md`. No ADR, implementation
task, manifest, code, migration, dependency, workflow, secret, credential, deployment, Import Center file, or other
agent's mailbox was touched. No GitHub review comment was posted.

## Limits

- Nothing PDF-derived is verified. Every table above that is not about the repository comes from the repository's
  own extract and docs.
- The Workflow PDF in particular is unread by anyone in this session, so nothing is known here about its
  coverage of this candidate.
