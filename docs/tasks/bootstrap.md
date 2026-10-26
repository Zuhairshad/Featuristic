# Bootstrap foundation

- Status: Verified after the commands recorded in the handoff pass.
- Owner: Core installer
- Scope: workspace bootstrap, read-only inspection, manifest validation, and a minimal fixture.

## Acceptance criteria

1. `feature inspect <project-directory>` never executes target-project code or changes the target.
2. The report captures evidence paths and unknowns for Next.js, React, TypeScript, and Supabase.
3. A dependency alone never changes the support assessment to compatible.
4. Tests cover a valid project, malformed `package.json`, missing metadata, and preservation of the target.
5. The fixture has no Supabase credentials or active database operation.

## Out of scope

Feature installation, data imports, database migrations, queues, object storage, and production integrations.
