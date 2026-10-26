# PR feedback automation design handoff

- Task: [`docs/tasks/pr-feedback-automation-design.md`](../tasks/pr-feedback-automation-design.md)
- Branch: `claude/pr-feedback-automation-design-b`
- Base: `origin/feature/import-center` at `595b7f8e878a6d516ace9a0d1333f72bbd16c7d6`, fetched before branching.
- Final commit: the head of the pull request. A file cannot contain its own hash; read it from `git log -1` or
  the PR.
- Owner: Claude B

## Delivered

| Path | Content |
| --- | --- |
| `docs/adr/0003-pr-feedback-automation.md` | **Proposed** (not Accepted) design: trigger and round limit, same-repository-only rule, two-job least-privilege split, safe checkout and action settings, untrusted-input handling, the single secret, response path, non-goals, an illustrative non-executable sketch, sources, assumptions, open decisions, and the future acceptance checklist. |
| `docs/handoffs/pr-feedback-automation.md` | This file. |

No `.github/` content, secret, credential, dependency, code, manifest, or contract was added. Neither PR #1 nor
PR #2 was changed, and no branch was merged.

## Evidence inspected

- Current state: `git ls-tree -r --name-only origin/feature/import-center` shows no `.github/` path; the
  GitHub check-run listing for PR #1 and PR #2 returned `total_count: 0` on 2026-10-27.
- The PR #1 Codex review (comment `6425693207`), which contains the original workflow proposal that this ADR
  revises. Changes from that proposal: split into two jobs so the key-bearing job has no write token; set the
  read-only profile and `drop-sudo` explicitly; run the action as the last step; keep the prompt static and
  pass review text through `env:`; pin actions to full-length commit SHAs; add the acceptance checklist.
- Official sources, listed with links in the ADR: GitHub's "Events that trigger workflows" and "Secure use
  reference" (read from the `github/docs` repository), and the `openai/codex-action` README and
  `docs/security.md` (read from the `openai/codex-action` repository).

### Source-access limits (be aware before relying on citations)

`docs.github.com` and `developers.openai.com` failed to resolve (`getaddrinfo ENOTFOUND`) from the authoring
environment. The upstream Markdown on `raw.githubusercontent.com` was used instead. Consequences:

- The fork-PR statement (no secrets except `GITHUB_TOKEN`; read-only token) came from a search-result summary of
  the live GitHub page, not from page text. It is marked to-verify in the ADR.
- `developers.openai.com/codex/github-action` was seen only as a search snippet and is labeled as such.
- Quoted wording is a close paraphrase from fetched, summarized text, not a verbatim copy.

## Verification

| Command | Result |
| --- | --- |
| `git diff --cached --check` (before commit) | Exit 0, no whitespace errors. |
| `git diff --cached --name-only` | `docs/adr/0003-pr-feedback-automation.md` and `docs/handoffs/pr-feedback-automation.md` only. |
| `git diff --cached` grepped for key-shaped strings (`sk-`, `ghp_`, `github_pat_`, `AKIA`, private-key headers, JWT-like) | No matches. |
| `git diff --cached --name-only` grepped for `.github/`, `*.yml`/`*.yaml`, lockfiles, `package.json` | No matches. |

The same `git diff --check origin/feature/import-center...HEAD` is re-run after committing; its result is in the
PR description.

Nothing was executed against GitHub Actions: no workflow exists to run, and none was added.

## Deferred implementation steps (require a separate approved task)

1. Resolve the open decisions in the ADR (environment secret with reviewers, `.github/workflows/**` ownership,
   prompt ownership, version pins).
2. Write `.github/workflows/<name>.yml` per the ADR, with permissions declared explicitly and actions pinned to
   full-length commit SHAs.
3. A maintainer adds `OPENAI_API_KEY` as an Actions secret.
4. Run the acceptance checklist on a trusted same-repository test PR and record the evidence.
5. Confirm or correct the listed assumptions, update the ADR, and only then review it for Acceptance.

## Remaining gaps

- Live GitHub and OpenAI documentation pages were not directly read; re-check them before implementation.
- Repository settings (whether Actions is enabled, existing secrets, branch protection) were not inspected.
- The design has not been run anywhere. Every integration detail is unverified until the checklist is executed.
