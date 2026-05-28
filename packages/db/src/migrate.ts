import { closeDb, createPool } from "./client.js";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { drizzle } from "drizzle-orm/node-postgres";
import { loadDatabaseEnvFromSecrets } from "./secrets.js";
import * as schema from "./schema.js";

await loadDatabaseEnvFromSecrets();

const pool = createPool();
const db = drizzle(pool, { schema });

try {
  await migrate(db, { migrationsFolder: "migrations" });
  console.log("Database migrations complete.");
} finally {
  await pool.end();
  await closeDb();
}
