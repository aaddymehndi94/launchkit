export type Stage = "local" | "dev" | "prod";

export function readEnv(name: string, fallback?: string): string {
  const value = process.env[name];
  if (value && value.trim().length > 0) {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required environment variable: ${name}`);
}

export function readOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value : undefined;
}

export function readBooleanEnv(name: string, fallback = false): boolean {
  const value = readOptionalEnv(name);
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function readNumberEnv(name: string, fallback: number): number {
  const value = readOptionalEnv(name);
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Environment variable ${name} must be a number.`);
  }

  return parsed;
}

export function readStage(): Stage {
  const value = readEnv("STAGE", "local");
  if (value === "local" || value === "dev" || value === "prod") {
    return value;
  }

  throw new Error(`Invalid STAGE "${value}". Expected local, dev, or prod.`);
}
