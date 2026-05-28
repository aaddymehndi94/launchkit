import { Amplify } from "aws-amplify";
import type { RuntimeConfig } from "./runtime-config";

export function configureAmplify(config: RuntimeConfig): void {
  if (config.authMode !== "cognito") {
    return;
  }

  if (!config.userPoolId || !config.userPoolClientId) {
    throw new Error("Cognito runtime config is missing userPoolId or userPoolClientId.");
  }

  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: config.userPoolId,
        userPoolClientId: config.userPoolClientId,
        loginWith: {
          email: true
        }
      }
    }
  });
}
