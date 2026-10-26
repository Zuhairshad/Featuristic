# FeatureKit engineering rules

## Scope

FeatureKit installs substantial, verified application capabilities into supported existing applications.
The current supported-host experiment is Next.js App Router, React, TypeScript, and Supabase. The only
feature under active design is `import-center`; installation and database operations are not implemented.

## Ownership

| Area | Owner | Rules |
| --- | --- | --- |
| `apps/cli/**` | Core installer | Keep inspection deterministic and read-only. Do not execute inspected-project code. |
| `packages/contracts/**` | Contracts | Review schema or public-contract changes before dependent work proceeds. |
| `features/**` | Feature author | Keep manifests declarative; do not add host mutations here. |
| `fixtures/**` | Verification | Pin dependencies and keep all Supabase operations unconfigured unless a task explicitly provisions local Supabase. |
| `docs/**` | Maintainer | Record decisions, task evidence, limitations, and exact commands. |

## Safety and verification

- Read a file before changing it. Preserve unrelated files and user changes.
- Inspection may read only declared project metadata, known configuration files, and bounded source files.
  It must not execute scripts, load modules, read `.env*` files, print secrets, or modify the target.
- A dependency declaration is evidence only. It does not establish host compatibility or active integration.
- Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` for changes to this foundation.
- Do not add installation, migrations, background jobs, network calls, or production credentials without an
  approved task and explicit verification plan.
