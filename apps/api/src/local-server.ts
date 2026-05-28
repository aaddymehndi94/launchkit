import { serve } from "@hono/node-server";
import { readEnv } from "@launchkit/core";

process.env.AUTH_MODE ??= "local";
process.env.STAGE ??= "local";
process.env.DATABASE_URL ??= "postgres://launchkit:launchkit@localhost:5432/launchkit";
process.env.DATABASE_SSL ??= "false";
process.env.CORS_ALLOWED_ORIGINS ??= "http://localhost:5173";

const { app } = await import("./app.js");

const explicitPortArgIndex = process.argv.indexOf("--port");
const selectedPort =
  explicitPortArgIndex >= 0 && process.argv[explicitPortArgIndex + 1]
    ? Number(process.argv[explicitPortArgIndex + 1])
    : Number(readEnv("API_PORT", "4000"));

serve(
  {
    fetch: app.fetch,
    port: selectedPort
  },
  () => {
    console.log(`LaunchKit API listening on http://localhost:${selectedPort}`);
  }
);
