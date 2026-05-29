import path from "node:path";
import { closeDb, createPool } from "./client.js";
import { compareMigrationState, readLocalMigrations } from "./migration-state.js";
import { loadDatabaseEnvFromSecrets } from "./secrets.js";

type MigrationRow = {
  id: number;
  hash: string;
  created_at: number | string;
};

await loadDatabaseEnvFromSecrets();

const migrationsFolder = path.resolve(process.cwd(), "migrations");
const localMigrations = await readLocalMigrations(migrationsFolder);
const target = process.env.STAGE ?? "local";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. For dev/prod, set STAGE or APP_SECRET_NAME so Secrets Manager can load it.");
}

const pool = createPool(process.env.DATABASE_URL);

try {
  const tableExists = await pool.query<{ exists: boolean }>(
    `select exists (
      select 1
      from information_schema.tables
      where table_schema = 'drizzle' and table_name = '__drizzle_migrations'
    )`
  );

  const hasMigrationTable = tableExists.rows[0]?.exists ?? false;
  const applied = hasMigrationTable
    ? await pool.query<MigrationRow>(
        `select id, hash, created_at
         from drizzle.__drizzle_migrations
         order by created_at asc`
      )
    : { rows: [] };
  const appliedMigrations = applied.rows.map((row) => ({
    id: row.id,
    hash: row.hash,
    createdAt: Number(row.created_at)
  }));
  const comparison = compareMigrationState(localMigrations, appliedMigrations);

  console.log(`Target: ${target}`);
  console.log(`Migration files: ${localMigrations.length}`);
  for (const migration of localMigrations) {
    console.log(`- ${migration.tag}.sql`);
  }

  console.log("");
  console.log(`Applied migrations: ${applied.rows.length}`);
  for (const migration of applied.rows) {
    console.log(`- #${migration.id} ${new Date(Number(migration.created_at)).toISOString()} ${migration.hash.slice(0, 12)}`);
  }

  console.log("");
  console.log(`Status: ${comparison.status}`);
  if (comparison.status === "pending") {
    console.log(`Pending migrations: ${comparison.pending.length}`);
    for (const migration of comparison.pending) {
      console.log(`- ${migration.tag}.sql`);
    }
  }

  if (comparison.status === "ahead" || comparison.status === "diverged") {
    console.log(comparison.message);
    process.exitCode = 1;
  }

  if (!hasMigrationTable) {
    console.log("");
    console.log("No drizzle.__drizzle_migrations table found yet. Run pnpm dev or the appropriate db:ensure command first.");
  }
} finally {
  await pool.end();
  await closeDb();
}
