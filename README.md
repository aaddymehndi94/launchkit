# LaunchKit

LaunchKit is a full-stack AWS starter repository for small products that need the same foundation every time: React frontend, Lambda API, Cognito auth, S3 files, Secrets Manager, Neon Postgres, Drizzle migrations, dev/prod environments, and repeatable tests before deployment.

The default stack is TypeScript everywhere:

- `apps/web`: React + Vite + Tailwind v4 dashboard frontend.
- `apps/api`: Hono Lambda API for HTTP API Gateway.
- `packages/db`: Drizzle schema, SQL migrations, and query helpers.
- `infra/cdk`: AWS CDK v2 infrastructure.
- `packages/contracts`, `packages/core`, `packages/testing`: shared contracts, utilities, and test fixtures.

## Windows First-Time Setup

Use PowerShell in Windows Terminal. After installing tools, close and reopen the terminal so PATH updates are loaded.

### 1. Install Required Tools

Install with `winget`:

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

Check everything:

```powershell
git --version
node --version
corepack --version
pnpm --version
docker --version
docker compose version
docker info
aws --version
```

Expected: Node should be `24.x`. Docker Desktop must be open and fully running before local database commands work. If `docker info` fails, open Docker Desktop from the Start menu, wait until it says it is running, then open a new PowerShell window.

### 2. Configure AWS Credentials

Create a named AWS profile:

```powershell
aws configure --profile launchkit-dev
```

Enter your AWS access key, secret access key, default region, and output:

```text
Default region name: us-east-1
Default output format: json
```

Use the profile in the current terminal:

```powershell
$env:AWS_PROFILE="launchkit-dev"
$env:AWS_REGION="us-east-1"
aws sts get-caller-identity
```

For a permanent default in future terminals:

```powershell
setx AWS_PROFILE launchkit-dev
setx AWS_REGION us-east-1
```

### 3. Install Project Dependencies

From the repo root:

```powershell
pnpm install
```

This creates `pnpm-lock.yaml`. Commit that lockfile after the first install.

### 4. Start Local Database

Before starting Postgres, verify Docker:

```powershell
docker --version
docker compose version
docker info
```

On Windows, this error means Docker Desktop is installed but the Docker daemon is not running:

```text
npipe:////./pipe/docker_engine
```

Fix it by opening Docker Desktop from the Start menu and waiting until it says it is running. If Docker Desktop will not start, restart Windows once, then check WSL:

```powershell
wsl --status
wsl --install
wsl --update
```

Restart Windows after installing WSL, then open Docker Desktop again.

Then run:

```powershell
pnpm db:local:up
pnpm db:migrate:local
pnpm db:seed:local
```

Local Postgres runs at:

```text
postgres://launchkit:launchkit@localhost:5432/launchkit
```

### 5. Run The App Locally

```powershell
pnpm dev
```

Open:

- Web: `http://localhost:5173`
- API health: `http://localhost:4000/health`

Local auth accepts any password. Use:

- Normal user: `user@example.com`
- Admin user: `admin@example.com`

## Neon Setup

Create two Neon databases or branches:

- `launchkit-dev`
- `launchkit-prod`

Copy each connection string. Use SSL. A typical Neon URL looks like:

```text
postgresql://user:password@host/dbname?sslmode=require
```

Do not commit database URLs. They go into AWS Secrets Manager after CDK creates the stage secret.

## AWS First Deploy

Bootstrap CDK once per AWS account/region:

```powershell
pnpm --filter @launchkit/infra exec cdk bootstrap
```

Deploy dev:

```powershell
pnpm deploy:dev
```

The deploy creates a Secrets Manager secret:

```text
/launchkit/dev/app
```

Open AWS Secrets Manager, edit that secret, and replace the placeholder JSON with your Neon dev values:

```json
{
  "DATABASE_URL": "postgresql://user:password@host/launchkit-dev?sslmode=require",
  "DATABASE_SSL": "true"
}
```

Run deployed dev migrations:

```powershell
pnpm db:migrate:dev
```

Deploy again so Lambda and frontend are fully ready:

```powershell
pnpm deploy:dev
```

For prod, repeat with:

```powershell
pnpm deploy:prod
pnpm db:migrate:prod
```

Prod migration asks you to type `MIGRATE PROD` before it runs.

## Daily Commands

```powershell
pnpm dev                 # local API + web
pnpm verify              # lint, typecheck, tests, build, cdk synth
pnpm docker:check        # verify Docker CLI, Compose, and daemon
pnpm db:generate         # generate Drizzle migration after schema changes
pnpm db:migrate:local    # apply migrations locally
pnpm deploy:dev          # verify, then deploy dev
pnpm deploy:prod         # verify, then deploy prod
```

## Manual AWS Setup Notes

You can do the first-time dashboard work manually:

- IAM: make sure your AWS user/role can deploy CDK stacks, Lambda, API Gateway, Cognito, S3, CloudFront, Secrets Manager, IAM, and CloudWatch.
- Secrets Manager: update `/launchkit/dev/app` and `/launchkit/prod/app` with Neon URLs.
- Cognito: after users sign up, add admin users to the `admin` group from the Cognito console, or use the admin dashboard once an admin exists.
- CloudFront: the frontend URL is printed by CDK outputs after deploy.

## Cost Defaults

LaunchKit keeps costs low by default:

- Lambda and HTTP API are pay-per-use.
- No VPC and no NAT Gateway.
- S3 + CloudFront host the frontend.
- Neon hosts Postgres outside AWS.
- Logs have short retention in dev.
- Dev resources use destroy-friendly removal policies.

## More Docs

- [Windows setup](docs/windows-setup.md)
- [Architecture](docs/architecture.md)
- [Database and migrations](docs/database.md)
- [Deployment runbook](docs/deployment.md)
- [Agent guide](docs/AGENTS.md)
