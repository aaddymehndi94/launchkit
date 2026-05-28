# LaunchKit Agent Guide

This file is the first context document coding agents should read before changing this repo.

LaunchKit is a TypeScript full-stack AWS starter kit. Keep changes modular, low-cost, secure by default, and easy for a future agent to continue.

## Project Map

- `apps/web`: React, Vite, Tailwind v4 frontend. Runtime config is loaded from `/config/runtime.json`.
- `apps/api`: Hono API running locally with Node and in AWS Lambda behind HTTP API Gateway.
- `packages/contracts`: Zod schemas, shared API types, and route constants.
- `packages/core`: shared config, auth, errors, logging, IDs, and response helpers.
- `packages/db`: Drizzle schema, migrations, Postgres client, seeds, and query helpers.
- `packages/testing`: shared fixtures and test helpers.
- `infra/cdk`: AWS CDK v2 app, constructs, stage config, and infrastructure tests.
- `scripts`: cross-platform operational scripts. Prefer Node/TypeScript scripts over shell-specific logic.
- `docs`: setup, architecture, database, deployment, and human-facing runbooks.

## Operating Rules

- Use `pnpm` only. Do not introduce npm, yarn, or alternate package managers.
- Keep TypeScript strict. Do not weaken compiler or lint settings to make a change pass.
- Keep secrets out of git. Use `.env.local` locally and AWS Secrets Manager for deployed stages.
- Do not deploy, destroy, migrate prod, or mutate AWS resources unless the user explicitly asks.
- Prefer small focused changes over broad rewrites. Preserve existing architecture unless the task truly requires changing it.
- Add or update tests when changing behavior, contracts, database schema, auth, CDK, or user-facing UI.
- Run the narrowest useful check while developing, then `pnpm verify` before handoff when feasible.
- If a command cannot run because local tools or credentials are missing, say exactly what is missing.

## Common Commands

```powershell
pnpm install
pnpm docker:check
pnpm db:local:up
pnpm db:migrate:local
pnpm db:seed:local
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm verify
pnpm deploy:dev
```

`pnpm deploy:dev` and `pnpm deploy:prod` already run `pnpm verify` first.

## Feature Workflow

For a new API-backed feature:

1. Add shared request/response schemas in `packages/contracts`.
2. Add or update Drizzle schema/query helpers in `packages/db` if persistence is needed.
3. Add Hono routes in `apps/api/src/routes` and mount them in `apps/api/src/app.ts`.
4. Update `apps/web/src/lib/api-client.ts`.
5. Add or update React pages/components.
6. Add tests at the package or app boundary touched by the change.
7. Run `pnpm verify`.

## Backend Practices

- API responses use envelopes:
  - Success: `{ data, requestId }`
  - Error: `{ error: { code, message }, requestId }`
- Throw `AppError` helpers from `@launchkit/core` for expected failures.
- Keep route handlers thin. Put reusable data access in `packages/db/src/queries`.
- Load deployed secrets through Secrets Manager; do not read secret values from CDK outputs.
- Cognito JWT claims arrive through API Gateway authorizers. Frontend API calls use Cognito ID tokens because the backend needs profile claims such as email.
- Do not protect `OPTIONS` routes. Browser CORS preflight must stay unauthenticated.

## Frontend Practices

- Build product screens, not marketing pages. The app should open into useful authenticated workflows.
- Use existing components in `apps/web/src/components` before adding new primitives.
- Use Tailwind v4 classes and lucide icons for actions.
- Keep normal-user and admin workflows clearly separated.
- Fetch server state through TanStack Query.
- Route all API calls through `apps/web/src/lib/api-client.ts`.
- Avoid visible instructional text inside the app unless it is part of a real workflow state.

## Database Practices

- Drizzle schema in `packages/db/src/schema.ts` is the source of truth.
- Generate migrations with `pnpm db:generate`.
- Review generated SQL before committing.
- Apply local migrations with `pnpm db:migrate:local`.
- Deployed migrations read `/launchkit/{stage}/app` from Secrets Manager when `DATABASE_URL` is not already set.
- Use backward-compatible migrations by default. For destructive changes, use expand, migrate data, then contract in a separate change.

## Infrastructure Practices

- CDK code lives in `infra/cdk`.
- Stage config lives in `infra/cdk/config/stages`.
- Add focused constructs under `infra/cdk/lib/constructs`.
- Use least-privilege IAM grants.
- Keep Lambda outside a VPC unless there is a concrete reason; avoiding NAT Gateway keeps costs low.
- Dev resources are destroy-friendly. Prod resources should retain data by default.
- Update CDK assertion tests when changing infrastructure shape.

## Testing Expectations

- `pnpm lint`: style and import correctness.
- `pnpm typecheck`: TypeScript correctness across workspaces.
- `pnpm test`: unit and CDK assertion tests.
- `pnpm build`: frontend build plus type-only package builds.
- `pnpm cdk:synth`: infrastructure synthesis.
- `pnpm verify`: the full pre-deploy gate.

For frontend behavior, prefer React Testing Library tests. For infrastructure behavior, assert resource properties rather than brittle exact resource counts when CDK helper resources may be created.

## Windows Notes

- Docker Desktop must be running before `pnpm db:local:up`.
- If Docker fails with `npipe:////./pipe/docker_engine`, open Docker Desktop and wait for the daemon.
- If Docker Desktop will not start, check WSL with `wsl --status`; install with `wsl --install` if missing.
- Use PowerShell-friendly commands in docs and scripts.

## Handoff Checklist

Before finishing a task:

- Explain what changed and why.
- Mention tests/checks run.
- Mention any checks not run and the exact reason.
- Mention required manual follow-up, especially AWS deploys, Secrets Manager edits, or migrations.
- Do not claim a deploy happened unless it actually ran.
