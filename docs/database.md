# Database And Migrations

Drizzle schema lives in `packages/db/src/schema.ts`.

## Local

```powershell
pnpm db:local:up
pnpm db:migrate:local
pnpm db:seed:local
```

## Creating A Migration

Change the schema, then run:

```powershell
pnpm db:generate
```

Review the generated SQL before committing.

## Deployed Stages

For dev:

```powershell
pnpm db:migrate:dev
```

For prod:

```powershell
pnpm db:migrate:prod
```

The deployed migration scripts load `DATABASE_URL` from `/launchkit/{stage}/app` in Secrets Manager when `DATABASE_URL` is not already set.

## Migration Rule

Default to backward-compatible migrations. For destructive changes, use expand, migrate data, then contract in a separate deploy.
