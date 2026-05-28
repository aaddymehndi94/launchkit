type Stage = "dev" | "prod";

const stage = process.argv[2] as Stage | undefined;
if (stage !== "dev" && stage !== "prod") {
  throw new Error("Usage: pnpm smoke:dev or pnpm smoke:prod");
}

const apiUrl = process.env.LAUNCHKIT_API_URL;
if (!apiUrl) {
  throw new Error("Set LAUNCHKIT_API_URL to the deployed HTTP API URL before running smoke tests.");
}

const health = await fetch(new URL("/health", apiUrl));
if (!health.ok) {
  throw new Error(`Health check failed for ${stage}: ${health.status} ${await health.text()}`);
}

const protectedResponse = await fetch(new URL("/me", apiUrl));
if (protectedResponse.status !== 401 && protectedResponse.status !== 403) {
  throw new Error(`Expected /me without auth to be rejected, got ${protectedResponse.status}`);
}

console.log(`Smoke checks passed for ${stage}.`);
