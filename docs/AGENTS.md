# Agent Guide

The canonical coding-agent guide is the repo-level [`AGENTS.md`](../AGENTS.md). This file keeps the quick workflow summary for readers already inside `docs`.

This repo is designed so coding agents can add features predictably.

## Add An API Feature

1. Add request/response schemas in `packages/contracts`.
2. Add or update DB tables/queries in `packages/db`.
3. Add a Hono route in `apps/api/src/routes`.
4. Mount the route in `apps/api/src/app.ts`.
5. Add API tests.
6. Update the frontend API client if the UI needs it.

## Add A Database Change

1. Edit `packages/db/src/schema.ts`.
2. Run `pnpm db:generate`.
3. Review SQL in `packages/db/migrations`.
4. Add or update query helpers.
5. Add tests for behavior, not only schema existence.

## Add A Frontend Screen

1. Add a page under `apps/web/src/pages`.
2. Add API calls through `apps/web/src/lib/api-client.ts`.
3. Add route entries in `apps/web/src/App.tsx`.
4. Use existing components before creating new visual primitives.
5. Keep user and admin workflows separate.

## Add Infrastructure

1. Add a focused construct under `infra/cdk/lib/constructs`.
2. Wire it through `LaunchKitStack`.
3. Add least-privilege grants.
4. Add a CDK assertion test.
5. Document required manual setup in README or `docs/deployment.md`.

## Before Handoff

Run:

```powershell
pnpm verify
```

If verification cannot run because local tools are missing, state exactly which tools are missing.
