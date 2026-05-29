import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";
import path from "node:path";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { closeDb, createPool } from "./client.js";
import { compareMigrationState, readLocalMigrations } from "./migration-state.js";
import { loadDatabaseEnvFromSecrets } from "./secrets.js";
import * as schema from "./schema.js";

type Stage = "local" | "dev" | "prod";

const stage = process.argv[2] as Stage | undefined;
if (stage !== "local" && stage !== "dev" && stage !== "prod") {
  throw new Error("Usage: tsx src/ensure-migrations.ts local|dev|prod");
}

try {
  await loadDatabaseEnvFromSecrets();
} catch (error) {
  if ((stage === "dev" || stage === "prod") && isResourceNotFound(error)) {
    console.error(`Database secret /launchkit/${stage}/app does not exist yet.`);
    console.error("Run the first infrastructure deploy to create it, update the secret with your Neon URL, then deploy again.");
    process.exit(2);
  }

  throw error;
}

const migrationsFolder = path.resolve(process.cwd(), "migrations");
const localMigrations = await readLocalMigrations(migrationsFolder);

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes("replace-me")) {
  if (stage === "local") {
    throw new Error("DATABASE_URL is required for local migration checks.");
  }

  console.error(`Database URL is not configured for ${stage}.`);
  console.error(`Update /launchkit/${stage}/app in Secrets Manager with your Neon DATABASE_URL, then deploy again.`);
  process.exit(2);
}

const pool = createPool(process.env.DATABASE_URL);
const db = drizzle(pool, { schema });

try {
  const appliedMigrations = await getAppliedMigrations();
  const comparison = compareMigrationState(localMigrations, appliedMigrations);

  if (comparison.status === "current") {
    console.log(`Database migrations are up to date for ${stage}.`);
  } else if (comparison.status === "pending") {
    console.log(`Database migrations pending for ${stage}: ${comparison.pending.length}`);
    printPending(comparison.pending);

    if (stage === "prod") {
      await confirmProdMigration();
    } else {
      console.log(`Applying pending ${stage} migrations before deployment.`);
    }

    await migrate(db, { migrationsFolder });
    console.log(`Database migrations are now up to date for ${stage}.`);
  } else if (stage === "local") {
    console.error(`Local database migration history is ${comparison.status}.`);
    console.error(comparison.message);
    process.exit(3);
  } else {
    throw new Error(`${stage} database migration history is ${comparison.status}: ${comparison.message}`);
  }
} finally {
  await pool.end();
  await closeDb();
}

async function getAppliedMigrations() {
  const tableExists = await pool.query<{ exists: boolean }>(
    `select exists (
      select 1
      from information_schema.tables
      where table_schema = 'drizzle' and table_name = '__drizzle_migrations'
    )`
  );

  if (!tableExists.rows[0]?.exists) {
    return [];
  }

  const applied = await pool.query<{ id: number; hash: string; created_at: string | number }>(
    `select id, hash, created_at
     from drizzle.__drizzle_migrations
     order by created_at asc`
  );

  return applied.rows.map((row) => ({
    id: row.id,
    hash: row.hash,
    createdAt: Number(row.created_at)
  }));
}

async function confirmProdMigration() {
  if (process.env.LAUNCHKIT_PROD_CONFIRMED === "true") {
    console.log("Applying pending prod migrations after DEPLOY PROD confirmation.");
    return;
  }

  const rl = createInterface({ input, output });
  const answer = await rl.question(
    "Pending prod database migrations must run before deployment. Type MIGRATE PROD to continue: "
  );
  rl.close();

  if (answer !== "MIGRATE PROD") {
    console.log("Prod deployment cancelled before database migration.");
    process.exit(1);
  }
}

function printPending(pending: Array<{ tag: string }>) {
  for (const migration of pending) {
    console.log(`- ${migration.tag}.sql`);
  }
}

function isResourceNotFound(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return error.name === "ResourceNotFoundException" || error.message.includes("Secrets Manager can't find");
}
