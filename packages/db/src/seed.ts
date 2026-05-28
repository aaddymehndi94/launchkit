import { closeDb, getDb } from "./client.js";
import { profiles } from "./schema.js";

const db = getDb();

await db
  .insert(profiles)
  .values([
    {
      cognitoSubject: "local-user",
      email: "user@example.com",
      displayName: "Local User",
      role: "user"
    },
    {
      cognitoSubject: "local-admin",
      email: "admin@example.com",
      displayName: "Local Admin",
      role: "admin"
    }
  ])
  .onConflictDoNothing();

await closeDb();
console.log("Local seed data complete.");
