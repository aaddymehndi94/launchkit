import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export type StageConfig = {
  stage: "dev" | "prod";
  region: string;
  removalPolicy: "destroy" | "retain";
  corsAllowedOrigins: string[];
  logRetentionDays: number;
};

const here = path.dirname(fileURLToPath(import.meta.url));

export function loadStageConfig(stage: string): StageConfig {
  if (stage !== "dev" && stage !== "prod") {
    throw new Error(`Unknown stage "${stage}". Expected dev or prod.`);
  }

  const filePath = path.resolve(here, "..", "config", "stages", `${stage}.json`);
  return JSON.parse(readFileSync(filePath, "utf8")) as StageConfig;
}

export function stackRemovalPolicy(config: StageConfig) {
  return config.removalPolicy;
}
