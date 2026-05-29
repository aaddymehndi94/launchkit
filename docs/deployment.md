# Deployment Runbook

## Dev

```powershell
$env:AWS_PROFILE="launchkit-dev"
$env:AWS_REGION="ap-south-1"
pnpm deploy:dev
```

`pnpm deploy:dev` runs `pnpm verify`, checks exact dev database migration state, applies pending dev migrations, then deploys CDK.

On a first deploy, the database secret may not exist yet. The script deploys infrastructure once to create `/launchkit/dev/app`, then stops. Add your Neon dev connection string to that secret and run:

```powershell
pnpm deploy:dev
```

## Prod

```powershell
$env:AWS_PROFILE="launchkit-dev"
$env:AWS_REGION="ap-south-1"
pnpm deploy:prod
```

Type `DEPLOY PROD` once. After that confirmation, the script runs verification, checks exact prod database migration state, applies pending prod migrations, then deploys CDK.

Prod resources retain important data by default when the stack is removed.

## Release

Release commands run deploy and smoke checks. Deploy already runs verification and database migration checks:

```powershell
pnpm release:dev
pnpm release:prod
```

Set `LAUNCHKIT_API_URL` before release commands so smoke checks can reach the deployed API. `release:prod` calls `deploy:prod`, so the only prod confirmation is `DEPLOY PROD`.

## Smoke Check

Set the API URL from CDK outputs:

```powershell
$env:LAUNCHKIT_API_URL="https://your-api-id.execute-api.ap-south-1.amazonaws.com"
pnpm smoke:dev
```

## Destroy

Use safe wrappers instead of raw `cdk destroy`:

```powershell
pnpm destroy:dev
```

Prod destroy requires an explicit opt-in:

```powershell
$env:ALLOW_PROD_DESTROY="true"
pnpm destroy:prod
```
