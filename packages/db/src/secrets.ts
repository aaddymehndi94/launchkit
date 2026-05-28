import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import { readOptionalEnv } from "@launchkit/core";

export async function loadDatabaseEnvFromSecrets(): Promise<void> {
  if (readOptionalEnv("DATABASE_URL")) {
    return;
  }

  const explicitSecret = readOptionalEnv("APP_SECRET_ARN") ?? readOptionalEnv("APP_SECRET_NAME");
  const stage = readOptionalEnv("STAGE");
  const secretId = explicitSecret ?? (stage === "dev" || stage === "prod" ? `/launchkit/${stage}/app` : undefined);

  if (!secretId) {
    return;
  }

  const client = new SecretsManagerClient({});
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretId }));
  if (!response.SecretString) {
    return;
  }

  const values = JSON.parse(response.SecretString) as Record<string, unknown>;
  for (const [key, value] of Object.entries(values)) {
    if (typeof value === "string" && key.startsWith("DATABASE_")) {
      process.env[key] = value;
    }
  }
}
