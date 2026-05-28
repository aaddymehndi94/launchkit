import { createContext, useContext, useMemo } from "react";
import { useAuth } from "./auth";
import { createApiClient, type ApiClient } from "./api-client";
import type { RuntimeConfig } from "./runtime-config";

const ApiContext = createContext<ApiClient | undefined>(undefined);

export function ApiProvider({
  children,
  config
}: {
  children: React.ReactNode;
  config: RuntimeConfig;
}) {
  const auth = useAuth();
  const client = useMemo(
    () => createApiClient(config, auth.getAccessToken, () => auth.user),
    [auth, config]
  );

  return <ApiContext.Provider value={client}>{children}</ApiContext.Provider>;
}

export function useApi() {
  const value = useContext(ApiContext);
  if (!value) {
    throw new Error("useApi must be used within ApiProvider.");
  }

  return value;
}
