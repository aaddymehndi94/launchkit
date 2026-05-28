import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { readOptionalEnv } from "@launchkit/core";

const secrets = new SecretsManagerClient({});
let loadPromise: Promise<void> | undefined;

export function loadAppSecrets(): Promise<void> {
  loadPromise ??= load();
  return loadPromise;
}

async function load(): Promise<void> {
  const secretId = readOptionalEnv("APP_SECRET_ARN") ?? readOptionalEnv("APP_SECRET_NAME");
  if (!secretId) {
    return;
  }

  const response = await secrets.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!response.SecretString) {
    return;
  }

  const values = JSON.parse(response.SecretString) as Record<string, unknown>;
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string" && value.length > 0 && key !== "SETUP_TOKEN") {
      process.env[key] = value;
    }
  }
}
