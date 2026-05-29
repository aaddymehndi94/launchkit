# LaunchKit

LaunchKit is a starter kit for building web products on AWS.

It already includes:

- React frontend
- Lambda API
- Cognito auth
- S3 file storage
- Neon Postgres
- AWS CDK deploys
- dev and prod environments

The goal is simple: get a working product foundation without building the same setup from scratch every time.

## The Short Version

If you already have everything installed:

```powershell
pnpm install
pnpm dev
```

Open the frontend URL shown in the terminal, usually `http://localhost:5173`.

If you are brand new, start from the next section and go in order.

## 1. What You Need

Install these first:

- VS Code
- Node.js 24
- Git
- Docker Desktop
- AWS CLI

If you want to use Codex on this machine too:

- Codex CLI
- a ChatGPT account or OpenAI API account

## 2. Recommended Setup On Windows

Use:

- VS Code
- PowerShell terminal inside VS Code

Install tools in PowerShell:

```powershell
winget install --id Microsoft.VisualStudioCode -e
winget install --id Microsoft.WindowsTerminal -e
winget install --id Git.Git -e
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Docker.DockerDesktop -e
winget install --id Amazon.AWSCLI -e
```

It is recommended to restart your pc at this point.

Then enable `pnpm`:

```powershell
corepack enable
corepack prepare pnpm@10.13.1 --activate
```

Check that everything works:

```powershell
git --version
node --version
pnpm --version
docker --version
docker compose version
docker info
aws --version
```

Important:

- Docker Desktop must be open before `pnpm dev`
- if `docker info` fails with `npipe:////./pipe/docker_engine`, Docker is installed but not running
- if Docker does not start, run `wsl --status`, then `wsl --install` and `wsl --update`, then restart Windows

## 3. Open The Project In VS Code

In PowerShell:

```powershell
cd C:\path\to\launchkit
code .
```

Inside VS Code:

1. Open the folder
2. Open Terminal
3. Make sure the shell says PowerShell

## 4. Install Codex On This Machine

Install codex extension using vscode extensions and log in to your openai account

## 5. Get AWS Credentials

You need AWS credentials before you can deploy.

You should have:

- `AWS Access Key ID`
- `AWS Secret Access Key`
- AWS region, for example `ap-south-1`

Then run:

```powershell
aws configure --profile launchkit-dev
```

Enter:

- Access Key ID
- Secret Access Key
- Default region name
- Default output format: `json`

Then set the profile in your current PowerShell window:

```powershell
$env:AWS_PROFILE="launchkit-dev"
$env:AWS_REGION="ap-south-1"
aws sts get-caller-identity
```

If `aws sts get-caller-identity` works, your AWS credentials are ready.

### If You Need To Create Credentials Yourself In AWS Console

1. Sign in to the AWS Console
2. Search for `IAM`
3. Open `IAM`
4. Open `Users`
5. Create a user, or open an existing development user
6. Make sure that user has the permissions your team expects for CDK deploys
7. Open the `Security credentials` tab
8. Click `Create access key`
9. Choose the CLI use case
10. Copy or download:
    - Access key ID
    - Secret access key

Then run the same command:

```powershell
aws configure --profile launchkit-dev
```

The AWS CLI stores these in your Windows user profile, typically under:

- `%UserProfile%\.aws\credentials`
- `%UserProfile%\.aws\config`

## 6. Create Or Find Your Neon Database

You need one PostgreSQL connection string for each environment.

The simplest setup is:

- one Neon project
- one `dev` branch
- one `prod` branch

You can also use separate Neon projects if you prefer.

### In Neon Console

1. Sign in to Neon
2. Create a project if you do not already have one
3. Create or keep a branch for development
   - example name: `dev`
4. Create or keep a branch for production
   - example name: `prod`

### How To Copy The Connection String

In the Neon dashboard:

1. Open your project
2. Open the branch you want, such as `dev`
3. Click `Connect`
4. Choose the database and role you want to use
5. Copy the PostgreSQL connection string

It should look similar to this:

```text
postgresql://user:password@host/database?sslmode=require
```

Keep both of these ready:

- dev connection string
- prod connection string

Do not commit them into git.

## 7. Install Project Dependencies

In the project root:

```powershell
pnpm install
```

## 8. Run Locally

Start local development:

```powershell
pnpm dev
```

You do not need to manually start Docker Postgres or manually run local migrations in the normal flow.

`pnpm dev` will:

- check Docker
- start local Postgres
- apply local migrations if needed
- seed local demo data
- start the API and frontend

Local login users:

- user: `user@example.com`
- admin: `admin@example.com`
- password: anything

## 9. Prepare AWS For First Deploy

Set your AWS profile in the current PowerShell window:

```powershell
$env:AWS_PROFILE="launchkit-dev"
$env:AWS_REGION="ap-south-1"
```

Then bootstrap CDK once per AWS account and region:

```powershell
pnpm --filter @launchkit/infra exec cdk bootstrap
```

## 10. First Dev Deploy

Run:

```powershell
pnpm deploy:dev
```

What usually happens on the first run:

- LaunchKit creates the AWS infrastructure
- it may stop because the app secret does not exist yet with a real database URL

That is normal.

## 11. Add The Neon Dev Connection String In AWS Secrets Manager

After the first `pnpm deploy:dev`, open AWS Console and do this:

1. Search for `Secrets Manager`
2. Open `Secrets Manager`
3. Find the secret named:

```text
/launchkit/dev/app
```

4. Open that secret
5. Click `Retrieve secret value`
6. Click `Edit`
7. Replace the placeholder value with:

```json
{
  "DATABASE_URL": "postgresql://user:password@host/database?sslmode=require",
  "DATABASE_SSL": "true"
}
```

Use your Neon `dev` branch connection string there.

Save the secret.

Then go back to PowerShell and run:

```powershell
pnpm deploy:dev
```

This time LaunchKit should:

- run verification
- check the dev database migration history
- apply pending dev migrations
- deploy the app

## 12. Deploy To Production Later

When you are ready:

1. Put the Neon prod connection string into:

```text
/launchkit/prod/app
```

2. Run:

```powershell
pnpm deploy:prod
```

3. Type:

```text
DEPLOY PROD
```

That is the normal production confirmation.

## 13. The Main Commands You Will Actually Use

```powershell
pnpm dev
pnpm deploy:dev
pnpm deploy:prod
pnpm verify
```

What they mean:

- `pnpm dev`: run locally
- `pnpm deploy:dev`: verify, migrate dev DB if needed, deploy dev
- `pnpm deploy:prod`: verify, migrate prod DB if needed, deploy prod
- `pnpm verify`: run lint, typecheck, tests, build, DB check, and CDK synth

## 14. If Something Breaks

Try these first:

```powershell
pnpm verify
pnpm db:status:local
pnpm db:local:reset
```

What they mean:

- `pnpm verify`: full health check for the repo
- `pnpm db:status:local`: shows whether local DB migrations match the repo
- `pnpm db:local:reset`: deletes only the local Docker database and rebuilds it

If Docker is the problem:

- open Docker Desktop
- wait until it says it is running
- rerun `pnpm dev`

If AWS is the problem:

- rerun `aws sts get-caller-identity`
- make sure `$env:AWS_PROFILE` is set in the same PowerShell window

## 15. For Developers And Coding Agents

Read [`AGENTS.md`](AGENTS.md) first.

That file explains:

- how the repo is organized
- how features should be added
- testing rules
- migration rules
- deploy rules

## More Detail

If you need the longer docs:

- [Windows setup](docs/windows-setup.md)
- [Architecture](docs/architecture.md)
- [Database and migrations](docs/database.md)
- [Deployment runbook](docs/deployment.md)

## Official References Used For This README

- OpenAI Codex CLI help: `codex --login` and `npm install -g @openai/codex`
  - https://help.openai.com/en/articles/11381614-api-codex-cli-and-sign-in-with-chatgpt
  - https://help.openai.com/en/articles/11096431
- AWS CLI configuration and environment variables
  - https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-configure.html
  - https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html
  - https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-files.html
- AWS Secrets Manager
  - https://docs.aws.amazon.com/secretsmanager/latest/userguide/create_secret.html
- Neon connection strings and branches
  - https://api-docs.neon.tech/reference/getconnectionuri
  - https://api-docs.neon.tech/reference/listprojectbranches
