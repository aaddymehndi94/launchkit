import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(here, "..", "..", "..");
export const apiEntry = path.join(repoRoot, "apps", "api", "src", "handler.ts");
export const webDist = path.join(repoRoot, "apps", "web", "dist");
export const pnpmLock = path.join(repoRoot, "pnpm-lock.yaml");
