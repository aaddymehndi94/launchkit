import type { AuthContext } from "@launchkit/core";
import type { Profile } from "@launchkit/contracts";

export type AppVariables = {
  auth: AuthContext;
  profile: Profile;
  requestId: string;
};

export type AppEnv = {
  Variables: AppVariables;
};

export type JwtClaims = Record<string, string | string[] | undefined>;
