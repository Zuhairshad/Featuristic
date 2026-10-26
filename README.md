# FeatureKit

FeatureKit is an open-source installer for substantial application features. It is beginning with a
small, executable foundation for inspecting a proposed host application before any change is made.

## Current scope

- Supported-host target: Next.js App Router, React, TypeScript, and Supabase.
- Planned first feature: Data Import Center (CSV upload, mapping, validation preview, background import,
  progress, and row-error download).
- Implemented today: feature-manifest validation and a read-only `feature inspect` command.
- Not implemented: feature installation and production deployment. Local-only implementation work for the
  Import Center is governed by `docs/tasks/import-center.md`; it does not authorize remote Supabase access or
  production credentials.

## Local setup

Prerequisites: Node.js `>=22.12.0` and Corepack.

```sh
corepack enable
corepack prepare pnpm@10.28.1 --activate
pnpm install --frozen-lockfile
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm inspect:fixture
```

To inspect another project after building the CLI:

```sh
pnpm exec feature inspect /absolute/path/to/project
```

The command emits JSON containing evidence and unknowns. It does not execute target-project code, read
environment files, modify the target, or claim compatibility from dependency declarations alone.

## Workspace

```text
apps/cli                 Read-only inspector CLI
packages/contracts       Manifest schema and validation
features/import-center   Declarative first-feature manifest
fixtures/next-supabase   Minimal unconfigured Next/Supabase host fixture
docs/                    ADRs, task definitions, and handoffs
```

See [`docs/adr/0001-initial-featurekit-foundation.md`](docs/adr/0001-initial-featurekit-foundation.md)
for version pins and architecture rationale.
