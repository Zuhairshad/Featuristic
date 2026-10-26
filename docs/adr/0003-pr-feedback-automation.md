# ADR 0003: Advisory Codex pull-request review workflow (proposed)

- Status: **Proposed.** Not accepted. No workflow, secret, or automation is configured, reviewed, or tested.
- Date: 2026-10-27
- Task: [`docs/tasks/pr-feedback-automation-design.md`](../tasks/pr-feedback-automation-design.md)
- Origin: the workflow proposal in the Codex review of PR #1 (comment `6425693207`)
- Amended 2026-10-27 with the coordinator's baseline security decisions (see "Coordinator decisions"). Still Proposed.

## Context

Codex reviews pull requests by hand today, and Claude agents read those reviews and push revisions. The PR #1
review proposed an automatic, advisory Codex review. This ADR turns that proposal into a reviewable design and
corrects its weak points. It authorizes nothing: implementing it needs a separate approved task.

**Verified current state** (checked at `origin/feature/import-center` `595b7f8`, 2026-10-27):

- The tree contains no `.github/` directory, so there is no workflow file.
- The GitHub check-run listing for PR #1 and PR #2 returns `total_count: 0`.
- No repository secret or bot integration is recorded in any task, ADR, or handoff. Whether Actions is enabled
  and which secrets exist are repository settings that were not inspected; this ADR does not assume them.

## Decision (proposed)

Add **one** advisory workflow that runs the official `openai/codex-action` once when a same-repository pull
request is opened or reopened and posts Codex's final message as a single PR comment. It cannot merge, deploy,
approve, push, or edit application source. Everything after that comment is a human or Claude action.

### 1. Trigger and round limit

- Event: `pull_request` with `types: [opened, reopened]`.
- GitHub documents that, without `types`, `pull_request` runs for `opened`, `synchronize`, and `reopened`, and
  that `types` selects other activity types. Omitting `synchronize` means ordinary follow-up pushes do not
  re-run the review. This is the mechanism for the one-round limit.
- Comments do not trigger it: the workflow subscribes to no comment event.
- A bot comment or push cannot loop. Events created with the workflow `GITHUB_TOKEN` generally do not start
  workflow runs, with documented exceptions (`workflow_dispatch`, `repository_dispatch`, and
  `pull_request` runs for PRs the token itself creates or updates, which need approval). This workflow
  creates only a comment, and it is not subscribed to comment events, so neither rule can re-trigger it.
- A person closing and reopening a PR starts one more review. That is a deliberate manual action, not a loop.
- A later Codex review stays **manual** (a person asks for it). Changing that needs a separate approved design.

### 2. Same-repository pull requests only

- Job condition: `github.event.pull_request.head.repo.full_name == github.repository`.
- For `pull_request`, GitHub's documentation (as summarized by search; to verify on the live page, see Sources)
  does not pass secrets other than `GITHUB_TOKEN` to workflows from forks, and gives fork PRs a read-only token. The action would have no API key there, so the condition also avoids a failing
  run. It is not the only protection: the secret is simply never exposed to fork code.
- `pull_request_target` is **not** used. GitHub's secure-use guidance says to avoid it unless necessary, and that
  workflows using it must not explicitly check out untrusted code.
- Self-hosted runners are not used. GitHub's guidance says they should almost never be used for public
  repositories, and the action's guidance says `drop-sudo` changes persist on reused runners. Use
  GitHub-hosted Linux runners.

### 3. Two jobs, least privilege

Split the work so the job that holds the API key has no write permission, and the job that writes has no key.
The action's own example workflow uses the same split.

| Job | Permissions | Holds `OPENAI_API_KEY` | Purpose |
| --- | --- | --- | --- |
| `codex` | `contents: read` only | Yes, through the protected environment `codex-pr-review` | Wait for environment approval, then check out, run the action, expose `final-message` as a job output. |
| `post_feedback` | `pull-requests: write` (plus `issues: write` only if the comment call requires it) | No | Post the review as one PR comment. |

- Set `permissions:` explicitly at workflow and job level. GitHub's guidance is to grant `GITHUB_TOKEN` the
  minimum required permissions and raise them per job.
- The proposed design grants no `contents: write`, no `actions`, no `id-token`, no `deployments`, and nothing
  that can merge. The workflow cannot merge or deploy because it holds no token capable of either and contains
  no step that attempts it.

### 4. Safe checkout and action settings

- `actions/checkout` with `persist-credentials: false`, checking out the PR merge commit. For `pull_request`,
  GitHub sets `GITHUB_SHA` to the last merge commit of the PR merge branch and `GITHUB_REF` to
  `refs/pull/<n>/merge`.
- `fetch-depth: 0` or an explicit fetch of the base and head refs so Codex can read the diff.
- `openai/codex-action` run as the **last step** of its job (the action's guidance: Codex can leave processes
  running or modify files such as `.git/hooks`, so the host cannot be trusted afterwards). Pass output to the
  next job instead.
- `safety-strategy: drop-sudo` (the action's default; set it explicitly). The action's security page says to use
  `drop-sudo` or `unprivileged-user` to keep the key secret, and notes that read-only filesystem access combined
  with `sudo` can expose the key (passwordless `sudo` is the default on GitHub-hosted runners).
- A read-only permission profile so Codex cannot edit the checkout. Per the action's README (read through a
  summary), built-in profiles include `:workspace` and `:read-only`. **Assumption:** `permission-profile:
  ":read-only"` combined with `safety-strategy: drop-sudo` is accepted. The README states that
  `safety-strategy: read-only` cannot be combined with a profile, which is a different setting. Confirm on a
  trusted test PR.
- Leave `allow-users`, `allow-bots`, and `allow-bot-users` unset. By default the action runs only for users with
  write access, and `allow-users: "*"` can expose API-key quota to strangers.
- Do not load Codex config or named permission profiles from the checkout. The action treats them as trusted.

### 5. Untrusted input and the prompt

- Keep the prompt **static**, in the workflow file or a prompt file. Do not interpolate the PR title, PR body,
  branch name, commit messages, or comments into the prompt, a `run:` script, or an expression.
- The action's security page says prompt injection can arrive through PR titles and bodies, commit messages,
  and repository instruction files, including hidden HTML comments, and that `AGENTS.md` in PR-controlled
  content is part of the untrusted input surface. Codex will necessarily read the PR's diff and files, so this
  risk is reduced, not removed. The controls that bound its impact are: no write token in the key-bearing job,
  a read-only profile, `drop-sudo`, and a single advisory comment as the only output.
- In the posting job, pass the review text through `env:` and read it from the environment. GitHub's secure-use
  guidance prefers an intermediate environment variable (or an action) over expanding untrusted values into an
  inline script. Never `${{ }}`-expand the review text into code.
- The review text is model output derived from untrusted input. Treat it as untrusted when posting.

### 6. The one secret

| Name | Purpose | Storage |
| --- | --- | --- |
| `OPENAI_API_KEY` | Lets the action call the OpenAI API for the review. | GitHub Actions secret only. |

No value, example token, or key-shaped string appears in this ADR, in a repository file, or in a log. Rotate or
revoke through the OpenAI Platform if it leaks, as the action's security page advises.

**Protected environment (coordinator decision).** `OPENAI_API_KEY` is held by the GitHub Actions environment
`codex-pr-review`, which has at least one repository-maintainer required reviewer. The `codex` job declares
that environment, so the review begins only after a maintainer approves the run. This deliberate manual release
protects the secret from unreviewed same-repository PR code. It matters because GitHub gives read access to
repository secrets to anyone with write access, and a same-repository PR author can change the workflow file
in their own PR; the environment gate means that change cannot reach the secret until a maintainer has looked at
the run. GitHub's secure-use guidance also notes that workflows using environment secrets "are not run in an
isolated environment", so approval is a gate, not a sandbox. Reopening a PR starts another run that needs its
own approval. **Assumption to verify at implementation:** that a job referencing a protected environment is
held before the environment's secrets are released; this is GitHub's documented environments behavior but its
page was not read for this ADR.

### 6a. Protected workflow and prompt paths (coordinator decision)

A future implementation task must add repository protection for **both** `.github/workflows/codex-pr-review.yml`
and the workflow's static prompt file, so neither can change without review. The task must use GitHub
CODEOWNERS or equivalent path protection and verify that the mechanism actually enforces review on those paths.
**If CODEOWNERS or path protection is unavailable, that task must stop and record the alternative for review.**
It must not substitute a weaker control.

### 6b. Version pins (coordinator decision)

`actions/checkout`, `openai/codex-action`, and any posting action are resolved to **full-length commit SHAs only
in the future implementation task**, using then-current official sources. No version or SHA is chosen, guessed,
or pinned in this ADR; the sketch below keeps placeholders on purpose.

### 7. Response path

1. The workflow posts one comment, marked with a fixed HTML comment so tools can recognize it.
2. Claude (or a human) reads the review, replies on the PR where a reply is needed, and pushes a normal
   revision. That push does not re-run the workflow because `synchronize` is not subscribed.
3. If another review is wanted, a person requests it manually.

### Explicit non-goals

- No automatic fixing, committing, merging, approving, labeling, or deploying.
- No automatic second round, no scheduled run, no run on comments, no run on forks.
- No change to application code, contracts, manifests, dependencies, or either existing PR.
- No claim that Codex output is correct or authoritative: it is advisory input to a human or Claude.

## Illustrative sketch (not installed, not a workflow file)

This only shows the shape of the design. It lives in a Markdown file, so it does nothing. Version pins are left
as placeholders because they have not been resolved.

```yaml
on:
  pull_request:
    types: [opened, reopened]
permissions: {}            # nothing by default; each job declares its own
jobs:
  codex:
    if: github.event.pull_request.head.repo.full_name == github.repository
    runs-on: ubuntu-latest
    environment: codex-pr-review   # protected; maintainer approval releases OPENAI_API_KEY
    permissions:
      contents: read
    outputs:
      final_message: ${{ steps.run_codex.outputs.final-message }}
    steps:
      - uses: actions/checkout@<full-length-commit-sha>      # persist-credentials: false
      - id: run_codex
        uses: openai/codex-action@<full-length-commit-sha>   # last step in the job
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          safety-strategy: drop-sudo
          permission-profile: ":read-only"                   # assumption, see section 4
          prompt-file: <static prompt path>                  # no PR text interpolated
  post_feedback:
    needs: codex
    if: needs.codex.outputs.final_message != ''
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/github-script@<full-length-commit-sha>
        env:
          REVIEW: ${{ needs.codex.outputs.final_message }}   # read from env, never expanded into code
        # script posts one comment prefixed with a fixed HTML-comment marker
```

## Sources

Read for this ADR on 2026-10-27. Pages on `docs.github.com` and `developers.openai.com` were **not directly
reachable** from the authoring environment; the GitHub guidance below was read from the `github/docs` source
repository and the action guidance from the `openai/codex-action` repository, which are the upstream sources of
those documents. Treat wording as a close paraphrase and re-check the live pages before implementation.

- GitHub Docs, [Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
  (`pull_request` default types, `types`, `GITHUB_SHA`/`GITHUB_REF`, events created by `GITHUB_TOKEN`).
- GitHub Docs, [Secure use reference](https://docs.github.com/en/actions/reference/security/secure-use)
  (least-privilege token, script injection and intermediate environment variables, `pull_request_target`,
  pinning to a full-length commit SHA, secrets access, self-hosted runners).
- GitHub Docs search summaries for fork behavior (no secrets other than `GITHUB_TOKEN`, read-only token for fork
  PRs) were not confirmed from the page text, because the fetched page defers fork details to a shared
  snippet. Treat that fork statement as **to verify on the live page**.
- OpenAI, [`openai/codex-action` README](https://github.com/openai/codex-action) (inputs, `final-message`
  output, `safety-strategy` values, permission profiles, example workflow with `pull_request` `opened`).
- OpenAI, [`openai/codex-action` security guidance](https://github.com/openai/codex-action/blob/main/docs/security.md)
  (write-access default, prompt injection, `drop-sudo`, protecting `OPENAI_API_KEY`, last-step rule).
- OpenAI, [Codex GitHub Action](https://developers.openai.com/codex/github-action) overview, seen only through a
  search snippet; not fetched.

**Untested integration details (assumptions):** exact input names and accepted values of `permission-profile`
and `safety-strategy` at the pinned version; that the posted comment fits GitHub's comment size limit (truncate
if needed, limit not verified here); and runner behavior of `drop-sudo` on the chosen runner image.

## Coordinator decisions (2026-10-27)

Recorded from `docs/coordination/responses/claude-b.md`. They are decisions about a future implementation; they do
not accept this ADR or authorize any workflow.

1. **Environment.** `OPENAI_API_KEY` lives in the protected environment `codex-pr-review` with at least one
   repository-maintainer required reviewer; the review begins after that approval (section 6).
2. **Protected paths.** The implementation task protects `.github/workflows/codex-pr-review.yml` and its static
   prompt, or stops and records an alternative if CODEOWNERS/path protection is unavailable (section 6a).
3. **Pins.** Full commit SHAs for every action are resolved only in the implementation task from then-current
   official sources (section 6b).

Still for the implementation task to settle: the exact path and content of the static prompt (the protection
above applies to it), and the assumptions listed under Sources.

## Acceptance checklist for a future implementation task

An implementation is accepted only when a **separate approved task** exists and all of the following have evidence:

- [ ] A separate approved implementation task names the exact paths, the workflow file, and its verification plan.
- [ ] The environment `codex-pr-review` exists with at least one repository-maintainer required reviewer, and
      `OPENAI_API_KEY` is configured there as an environment secret by a maintainer; the value never appears in a
      file, log, or comment.
- [ ] A test run shows the `codex` job waiting for approval and the review not starting until a maintainer approves.
- [ ] CODEOWNERS or equivalent protection covers `.github/workflows/codex-pr-review.yml` and its static prompt, with
      evidence that review is enforced; if unavailable, the task stopped and recorded the alternative for review.
- [ ] `actions/checkout`, `openai/codex-action`, and any posting action are pinned to full-length commit SHAs
      resolved in the implementation task from then-current official sources, recorded in the handoff.
- [ ] A **trusted test PR** from the same repository produces exactly **one** review comment.
- [ ] A fork PR (or an equivalent check) shows the job skipped or secret-less, with no secret exposure.
- [ ] Posting the comment does **not** start another run (the Actions run list shows no new run).
- [ ] A follow-up push to the PR does **not** start another run.
- [ ] Closing and reopening the PR starts at most one more run, and that is understood as manual.
- [ ] The workflow's effective permissions show `contents: read` for the key-bearing job and no write token
      anywhere that can merge or deploy; no step merges, deploys, approves, or pushes.
- [ ] A PR whose title, body, or file content contains instruction-like text does not change the workflow's
      permissions or outputs beyond the single comment.
- [ ] Assumptions listed above are confirmed or corrected in the ADR, which is then updated and reviewed before
      its status is changed from Proposed.
