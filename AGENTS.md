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

There should be one canonical agent guide: this root `AGENTS.md`. Do not add nested `AGENTS.md` files unless the user explicitly asks for scoped agent rules.

## Operating Rules

- Use `pnpm` only. Do not introduce npm, yarn, or alternate package managers.
- Keep TypeScript strict. Do not weaken compiler or lint settings to make a change pass.
- Keep secrets out of git. Use `.env.local` locally and AWS Secrets Manager for deployed stages.
- Do not deploy, destroy, migrate prod, or mutate AWS resources unless the user explicitly asks.
- Prefer small focused changes over broad rewrites. Preserve existing architecture unless the task truly requires changing it.
- Add or update tests for every new feature or behavior change. Docs-only edits may skip tests, but the handoff must say that the change was docs-only.
- Update tests when changing contracts, database schema, auth, CDK, API behavior, or user-facing UI.
- Run the narrowest useful check while developing, then `pnpm verify` before handoff when feasible.
- If a command cannot run because local tools or credentials are missing, say exactly what is missing.

## Common Commands

```powershell
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm verify
pnpm deploy:dev
pnpm deploy:prod
pnpm release:dev
pnpm destroy:dev
```

`pnpm dev` prepares the local database before starting servers. `pnpm deploy:dev` and `pnpm deploy:prod` run `pnpm verify`, ensure migrations, then deploy. Prod deploy asks exactly once for `DEPLOY PROD`; do not add a second prod prompt.

## Feature Workflow

For a new API-backed feature:

1. Add shared request/response schemas in `packages/contracts`.
2. Add or update Drizzle schema/query helpers in `packages/db` if persistence is needed.
3. Generate and review a Drizzle migration with `pnpm db:generate` when schema changes.
4. Add Hono routes in `apps/api/src/routes` and mount them in `apps/api/src/app.ts`.
5. Update `apps/web/src/lib/api-client.ts`.
6. Add or update React pages/components.
7. Add tests at every boundary touched by the change.
8. Run `pnpm verify`.

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
- Validate migration metadata with `pnpm db:check`.
- Review generated SQL before committing.
- Do not ask users to manually migrate during normal local development or normal deploys.
- Use `pnpm dev` locally; it starts Docker Postgres, checks exact migration history, applies pending local migrations, seeds, and starts servers.
- Use root deploy wrappers only: `pnpm deploy:dev` and `pnpm deploy:prod`.
- Deploy wrappers check exact migration history and apply pending suffix migrations before CDK deploy.
- Check migration state with `pnpm db:status:local`, `pnpm db:status:dev`, or `pnpm db:status:prod`.
- Deployed migrations read `/launchkit/{stage}/app` from Secrets Manager when `DATABASE_URL` is not already set.
- Manual `db:ensure:*` and `db:migrate:*` commands are advanced troubleshooting tools, not the default workflow.
- Use backward-compatible migrations by default. For destructive changes, use expand, migrate data, then contract in a separate change.
- Do not rely on automatic down migrations in prod. Fix mistakes with a forward corrective migration or a Neon restore/branch recovery plan.

## Infrastructure Practices

- CDK code lives in `infra/cdk`.
- Stage config lives in `infra/cdk/config/stages`.
- Add focused constructs under `infra/cdk/lib/constructs`.
- Use least-privilege IAM grants.
- Keep Lambda outside a VPC unless there is a concrete reason; avoiding NAT Gateway keeps costs low.
- Dev resources are destroy-friendly. Prod resources should retain data by default.
- Root deploy wrappers run verification and database migration checks before CDK deploy. Do not bypass them unless the user explicitly asks.
- `pnpm deploy:prod` is the only normal prod deploy confirmation path. `pnpm release:prod` must call it rather than adding another confirmation.
- Use root destroy wrappers (`pnpm destroy:dev`, `pnpm destroy:prod`) instead of raw `cdk destroy`.
- Update CDK assertion tests when changing infrastructure shape.

## Testing Expectations

- `pnpm lint`: style and import correctness.
- `pnpm typecheck`: TypeScript correctness across workspaces.
- `pnpm test`: unit and CDK assertion tests.
- `pnpm build`: frontend build plus type-only package builds.
- `pnpm db:check`: Drizzle migration metadata consistency.
- `pnpm cdk:synth`: infrastructure synthesis.
- `pnpm verify`: the full pre-deploy gate.

For frontend behavior, prefer React Testing Library tests. For infrastructure behavior, assert resource properties rather than brittle exact resource counts when CDK helper resources may be created.

## Windows Notes

- Docker Desktop must be running before `pnpm dev` can prepare local Postgres.
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
