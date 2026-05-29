# Database And Migrations

Drizzle schema lives in `packages/db/src/schema.ts`. SQL migrations live in `packages/db/migrations`.

## Normal Flow

Local development:

```powershell
pnpm dev
```

`pnpm dev` starts local Postgres, checks exact migration history, applies pending local migrations, seeds data, then starts the API and web app.

Deploys:

```powershell
pnpm deploy:dev
pnpm deploy:prod
```

Deploy wrappers run verification, compare migration state, apply pending suffix migrations, and then deploy CDK. Prod asks once for `DEPLOY PROD`.

## Creating A Migration

Change the schema, then run:

```powershell
pnpm db:generate
pnpm db:check
pnpm test
```

Review the generated SQL before committing.

## Checking State

```powershell
pnpm db:status:local
pnpm db:status:dev
pnpm db:status:prod
```

The guard compares `meta/_journal.json`, migration SQL timestamps, and SHA-256 SQL hashes against `drizzle.__drizzle_migrations`.

- `current`: database exactly matches the repo.
- `pending`: database has a valid prefix; pending repo migrations can be applied.
- `ahead`: database has migrations this repo does not know about.
- `diverged`: a timestamp or SQL hash does not match.

Local divergence during `pnpm dev` resets only the local Docker Postgres volume. Dev and prod never auto-reset.

## Advanced Manual Commands

```powershell
pnpm db:ensure:local
pnpm db:ensure:dev
pnpm db:ensure:prod
pnpm db:migrate:local
pnpm db:migrate:dev
pnpm db:migrate:prod
```

Use these only for troubleshooting or deliberate database operations outside the normal deploy path. `db:migrate:prod` keeps its own `MIGRATE PROD` confirmation.

The deployed migration scripts load `DATABASE_URL` from `/launchkit/{stage}/app` in Secrets Manager when `DATABASE_URL` is not already set.

## Migration Rule

Default to backward-compatible migrations. For destructive changes, use expand, migrate data, then contract in a separate deploy.

Production rollback is forward-only by default. If a schema mistake ships, add a corrective migration. For serious data issues, create or restore a Neon branch/restore point from the Neon dashboard, then redeploy intentionally.

## Local Reset

To destroy only the local Docker Postgres volume, rerun migrations, and seed:

```powershell
pnpm db:local:reset
```

The script requires typing `RESET LOCAL DB`.
