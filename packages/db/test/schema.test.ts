import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { files, profiles } from "../src/index.js";

describe("database schema", () => {
  it("exports the launch kit base tables", () => {
    expect(profiles).toBeDefined();
    expect(files).toBeDefined();
  });

  it("includes the profile photo migration as a second migration", () => {
    const migrationsPath = resolve(process.cwd(), "migrations");
    const photoMigration = readdirSync(migrationsPath).find((file) => file.startsWith("0001_") && file.endsWith(".sql"));

    expect(photoMigration).toBeDefined();
    expect(readFileSync(resolve(migrationsPath, photoMigration!), "utf8")).toContain('"profile_photo_key"');
  });
});
