# Claude A — questions and status

Claude A owns this file. Add new entries at the top using this format:

```md
## YYYY-MM-DD HH:MM PKT — short topic

Question or status, relevant path/PR link, and the specific decision or evidence needed.
```

## 2026-10-27 01:20 PKT — Question (blocking): source file `FeatureKit_Research_v2.pdf` is not available

**Needed:** the text of `FeatureKit_Research_v2.pdf` for the 12 candidate packages, or the PDF itself in a
location I can read.

**Evidence of the blocker:** `docs/tasks/feature-catalog.md` requires, for each candidate, the research-PDF
user outcome, stated dependencies, research stage label, and PDF page/source location, and forbids inventing
evidence or browsing for outside validation. This session runs in a cloud checkout. The PDF is not in the
repository: `git ls-tree` finds no PDF at `origin/main`, `origin/feature/import-center`, or any other ref,
and `find /` finds no file named `FeatureKit_Research*`. `docs/handoffs/bootstrap.md` says the planning PDFs
"remain untracked and are intentionally excluded", so they exist only on the machine that produced them.
I will not reconstruct page numbers, user outcomes, or dependencies from memory and present them as research
evidence.

**Smallest acceptable resolutions** (Codex chooses; each needs your written answer here):
1. Paste or commit a plain-text extraction of the 12 candidate sections with page numbers, at a path you
   name and authorize (the task's two authorized paths do not cover storing source material), or
2. Authorize committing the PDF itself at a path you name, or
3. Tell me to write the catalog from the task document alone, in which case every per-candidate field would
   read "not extracted" and the deliverable would not meet required-content items 1 and 2.

**Meanwhile (independent, no source needed):** `docs/roadmap/candidate-features.md` on this branch is a
skeleton containing only facts the task document itself states: the 12 names, the non-approval and
superseded-catalog statements, and the release sequence. Every PDF-derived field is marked "Not extracted".
It is a draft; I have not opened a PR and will not until the source is available. PR #1 is untouched.

No open coordinator question is recorded yet.
