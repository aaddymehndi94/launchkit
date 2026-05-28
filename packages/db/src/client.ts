import { readBooleanEnv, readEnv, readNumberEnv } from "@launchkit/core";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema.js";

export type DbClient = ReturnType<typeof createDb>;

let sharedPool: Pool | undefined;
let sharedDb: DbClient | undefined;

export function createPool(connectionString = readEnv("DATABASE_URL")): Pool {
  const useSsl = readBooleanEnv("DATABASE_SSL", connectionString.includes("neon.tech"));
  return new Pool({
    connectionString,
    max: readNumberEnv("DATABASE_POOL_MAX", 2),
    ssl: useSsl ? { rejectUnauthorized: true } : false
  });
}

export function createDb(pool = createPool()) {
  return drizzle(pool, { schema });
}

export function getDb(): DbClient {
  if (!sharedPool) {
    sharedPool = createPool();
  }

  if (!sharedDb) {
    sharedDb = createDb(sharedPool);
  }

  return sharedDb;
}

export async function closeDb(): Promise<void> {
  if (sharedPool) {
    await sharedPool.end();
    sharedPool = undefined;
    sharedDb = undefined;
  }
}
