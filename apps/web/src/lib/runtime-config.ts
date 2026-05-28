export type RuntimeConfig = {
  apiUrl: string;
  authMode: "local" | "cognito";
  awsRegion: string;
  userPoolId?: string;
  userPoolClientId?: string;
};

export async function loadRuntimeConfig(): Promise<RuntimeConfig> {
  const fallback = readViteConfig();

  try {
    const response = await fetch("/config/runtime.json", { cache: "no-store" });
    if (!response.ok) {
      return fallback;
    }

    return {
      ...fallback,
      ...((await response.json()) as Partial<RuntimeConfig>)
    };
  } catch {
    return fallback;
  }
}

function readViteConfig(): RuntimeConfig {
  return {
    apiUrl: import.meta.env.VITE_API_URL ?? "http://localhost:4000",
    authMode: import.meta.env.VITE_AUTH_MODE ?? "local",
    awsRegion: import.meta.env.VITE_AWS_REGION ?? "us-east-1",
    userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
    userPoolClientId: import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID
  };
}
