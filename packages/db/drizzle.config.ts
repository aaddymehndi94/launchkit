import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://launchkit:launchkit@localhost:5432/launchkit",
    ssl: process.env.DATABASE_SSL === "true"
  }
});
