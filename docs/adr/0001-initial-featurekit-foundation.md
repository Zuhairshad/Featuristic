# ADR 0001: Start with read-only host inspection

- Status: Accepted
- Date: 2026-10-26

## Context

FeatureKit aims to add complete frontend and backend capabilities to existing applications. Its initial
host profile is Next.js App Router, React, TypeScript, and Supabase. The project needs evidence about a
host before it can safely plan or install a feature.

## Decision

Create a pnpm workspace with a contracts package, a CLI, a declarative Import Center manifest, and a
minimal Next/Supabase fixture. The first executable command is:

```text
feature inspect <project-directory>
```

It reads `package.json`, known configuration paths, and bounded source files without running target code.
It reports observed evidence separately from unknowns. Its support assessment remains
`not-determined`; a declared package dependency alone never proves integration or compatibility.

The initial fixture declares Supabase and contains a type-only Supabase reference, but has no environment
values, client initialization, migrations, or database operations. Local Supabase setup is a future,
explicit task.

## Version pins

| Tool or dependency | Version | Rationale |
| --- | --- | --- |
| Node.js | `>=22.12.0` | Satisfies the selected test runner's Node requirement; local Node is `22.23.2`. |
| pnpm | `10.28.1` | Installed locally and pinned through the `packageManager` field. |
| Next.js | `16.4.3` | Current App Router release selected for the fixture. |
| React / React DOM | `19.3.1` | Satisfies Next `16.4.3`'s React 19 peer range. |
| TypeScript | `7.0.2` | Current compiler used for workspace type checking. |
| `@supabase/supabase-js` | `2.118.0` | Current base client; no session or project is configured yet. |
| AJV | `8.20.0` | Validates the published JSON Schema rather than relying on TypeScript types alone. |
| Vitest | `5.0.5` | Runs deterministic CLI and contract tests on Node 22. |
| Biome | `2.6.3` | Provides the workspace TypeScript lint check. |

The lockfile records complete transitive resolutions. All direct dependencies are exact pins.

## Consequences

- The project can prove that host inspection is non-mutating before installation exists.
- The fixture is intentionally not a usable Supabase application yet.
- Feature installation, service provisioning, and full Data Import Center behavior remain out of scope until
  their contracts and verification plan are approved.
