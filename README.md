# LaunchKit

LaunchKit is a full-stack AWS starter repository for products that need the same foundation every time: React frontend, Lambda API, Cognito auth, S3 files, Secrets Manager, Neon Postgres, Drizzle migrations, dev/prod environments, and repeatable checks before deployment.

The stack is TypeScript everywhere:

- `apps/web`: React, Vite, Tailwind v4 dashboard frontend.
- `apps/api`: Hono API running locally with Node and in AWS Lambda behind HTTP API Gateway.
- `packages/db`: Drizzle schema, SQL migrations, seeds, and query helpers.
- `packages/contracts`: Zod schemas and shared API types.
- `infra/cdk`: AWS CDK v2 infrastructure.
- `scripts`: cross-platform operational scripts.

The starter app includes profile editing, profile photo upload, file upload/download, and admin user management. It is intentionally small, but every feature crosses the real frontend, API, storage, database, auth, and test boundaries.

## Daily Workflow

For normal development, use these commands:

```powershell
pnpm dev
pnpm deploy:dev
pnpm deploy:prod
```

`pnpm dev` starts local Postgres, checks the exact migration history, applies pending local migrations, seeds local data, then starts the API and web app.

`pnpm deploy:dev` runs the full verification gate, checks the dev database migration history, applies pending dev migrations, then deploys CDK.

`pnpm deploy:prod` asks once for `DEPLOY PROD`, runs the full verification gate, checks the prod database migration history, applies pending prod migrations, then deploys CDK.

Manual migration commands still exist for advanced troubleshooting, but developers should not need them for normal local work or deploys.

## Windows First-Time Setup

Use PowerShell in Windows Terminal. After installing tools, close and reopen the terminal so PATH updates are loaded.

Install the required tools:

```powershell
winget install --id Microsoft.WindowsTerminal -e
winget install --id Git.Git -e
winget install --id Microsoft.VisualStudioCode -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Docker.DockerDesktop -e
winget install --id Amazon.AWSCLI -e
```

Enable pnpm through Corepack:

```powershell
corepack enable
corepack prepare pnpm@10.13.1 --activate
```

Verify tools:

```powershell
git --version
node --version
pnpm --version
docker --version
docker compose version
docker info
aws --version
```

Expected: Node should be `24.x`, matching `.nvmrc`. Docker Desktop must be open and fully running before `pnpm dev` can prepare the local database.

If `docker info` fails with `npipe:////./pipe/docker_engine`, open Docker Desktop from the Start menu and wait until it says it is running. If Docker still will not start:

```powershell
wsl --status
wsl --install
wsl --update
```

Restart Windows after installing or updating WSL.

## AWS And Neon Setup

Create an AWS profile:

```powershell
aws configure --profile launchkit-dev
$env:AWS_PROFILE="launchkit-dev"
$env:AWS_REGION="ap-south-1"
aws sts get-caller-identity
```

Use your preferred AWS region consistently for CDK bootstrap and deploys.

Create Neon databases or branches for:

- `launchkit-dev`
- `launchkit-prod`

Copy each connection string with SSL enabled, such as:

```text
postgresql://user:password@host/dbname?sslmode=require
```

Do not commit database URLs. Deployed stages load them from AWS Secrets Manager.

## Install And Run Locally

```powershell
pnpm install
pnpm dev
```

Open:

- Web: `http://localhost:5173`
- API health: `http://localhost:4000/health`

Local auth accepts any password:

- Normal user: `user@example.com`
- Admin user: `admin@example.com`

If a local migration was rewritten before it was committed, `pnpm dev` resets only the local Docker Postgres volume, applies the current migrations, seeds data, and continues. Dev and prod never auto-reset.

## Database Workflow

Drizzle schema lives in `packages/db/src/schema.ts`. Generated SQL migrations live in `packages/db/migrations`.

Normal schema change workflow:

```powershell
pnpm db:generate
pnpm db:check
pnpm test
pnpm dev
```

`db:generate` creates a migration from schema changes. `db:check` validates Drizzle metadata. `pnpm dev`, `pnpm deploy:dev`, and `pnpm deploy:prod` handle applying pending migrations automatically after exact history checks.

To inspect migration state:

```powershell
pnpm db:status:local
pnpm db:status:dev
pnpm db:status:prod
```

The migration guard compares the repo journal, SQL timestamps, and SHA-256 SQL hashes against `drizzle.__drizzle_migrations`. It applies only pending suffix migrations. If a shared database is ahead of the repo or history diverges, deploy stops.

Rollback strategy is intentionally forward-only in production. If a schema mistake ships, fix it with a new corrective migration. For serious data mistakes, use Neon restore points or branches from the Neon dashboard, then redeploy/migrate deliberately.

## AWS Deploy

Bootstrap once per AWS account/region:

```powershell
pnpm --filter @launchkit/infra exec cdk bootstrap
```

First dev deploy:

```powershell
pnpm deploy:dev
```

On the very first deploy, the database secret may not exist yet. The deploy script creates the infrastructure, stops, and tells you to update this Secrets Manager secret:

```text
/launchkit/dev/app
```

Use your Neon dev URL:

```json
{
  "DATABASE_URL": "postgresql://user:password@host/launchkit-dev?sslmode=require",
  "DATABASE_SSL": "true"
}
```

Then run:

```powershell
pnpm deploy:dev
```

The second deploy sees the configured database, applies pending migrations, and deploys the app.

For prod:

```powershell
pnpm deploy:prod
```

Type `DEPLOY PROD` once when prompted. There is no second migration prompt during the normal prod deploy path.

## Release And Smoke Checks

Smoke checks require the deployed API URL:

```powershell
$env:LAUNCHKIT_API_URL="https://your-api-id.execute-api.your-region.amazonaws.com"
pnpm smoke:dev
```

Release commands run deploy, then smoke checks:

```powershell
pnpm release:dev
pnpm release:prod
```

`release:prod` uses `pnpm deploy:prod`, so the only prod confirmation is `DEPLOY PROD`.

## Safe Destroy

Use the safe wrappers instead of raw `cdk destroy`:

```powershell
pnpm destroy:dev
```

Dev destroy prints AWS identity and stack name, then requires typing `DESTROY DEV`.

Prod destroy is deliberately harder:

```powershell
$env:ALLOW_PROD_DESTROY="true"
pnpm destroy:prod
```

It prints AWS identity and stack name, then requires typing `DESTROY PROD`. Prod CDK resources are configured with retain-first policies where appropriate, so some retained resources may need manual cleanup from AWS dashboards.

## Useful Commands

```powershell
pnpm dev                 # prepare local DB, seed, start API + web
pnpm verify              # lint, typecheck, tests, build, db check, cdk synth
pnpm test                # all workspace tests
pnpm docker:check        # verify Docker CLI, Compose, and daemon
pnpm db:generate         # generate Drizzle migration after schema changes
pnpm db:check            # validate Drizzle migration metadata
pnpm db:status:local     # show local migration state
pnpm deploy:dev          # verify, ensure dev DB, deploy dev
pnpm deploy:prod         # one confirmation, verify, ensure prod DB, deploy prod
pnpm release:dev         # deploy dev, then smoke dev
```

Advanced manual commands:

```powershell
pnpm db:ensure:local
pnpm db:ensure:dev
pnpm db:ensure:prod
pnpm db:migrate:local
pnpm db:migrate:dev
pnpm db:migrate:prod
pnpm db:local:reset
```

Use these only when diagnosing migration or database issues directly. `db:migrate:prod` keeps its own `MIGRATE PROD` confirmation because it bypasses the root deploy wrapper.

## Developer Handoff

Coding agents and developers should read [`AGENTS.md`](AGENTS.md) first. It is the canonical project guide.

For a new API-backed feature:

1. Add shared schemas and types in `packages/contracts`.
2. Add Drizzle schema, migration, mappers, and query helpers in `packages/db` when persistence is needed.
3. Add Hono routes in `apps/api`.
4. Add web client methods and React UI in `apps/web`.
5. Add tests at each boundary touched by the feature.
6. Run `pnpm verify` before handoff.

## More Docs

- [Windows setup](docs/windows-setup.md)
- [Architecture](docs/architecture.md)
- [Database and migrations](docs/database.md)
- [Deployment runbook](docs/deployment.md)
