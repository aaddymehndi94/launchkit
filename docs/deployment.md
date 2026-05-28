# Deployment Runbook

## Dev

```powershell
$env:AWS_PROFILE="launchkit-dev"
$env:AWS_REGION="us-east-1"
pnpm deploy:dev
```

After the first deploy, update `/launchkit/dev/app` in Secrets Manager, then:

```powershell
pnpm db:migrate:dev
pnpm deploy:dev
```

## Prod

```powershell
$env:AWS_PROFILE="launchkit-dev"
$env:AWS_REGION="us-east-1"
pnpm deploy:prod
pnpm db:migrate:prod
```

Prod keeps resources by default when the stack is removed.

## Smoke Check

Set the API URL from CDK outputs:

```powershell
$env:LAUNCHKIT_API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com"
pnpm smoke:dev
```
