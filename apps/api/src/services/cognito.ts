import {
  AdminAddUserToGroupCommand,
  AdminRemoveUserFromGroupCommand,
  CognitoIdentityProviderClient
} from "@aws-sdk/client-cognito-identity-provider";
import type { UserRole } from "@launchkit/core";
import { readOptionalEnv } from "@launchkit/core";

const cognito = new CognitoIdentityProviderClient({});

export async function syncCognitoGroups(username: string, role: UserRole): Promise<void> {
  const userPoolId = readOptionalEnv("COGNITO_USER_POOL_ID");
  if (!userPoolId) {
    return;
  }

  const addGroup = role === "admin" ? "admin" : "user";
  const removeGroup = role === "admin" ? "user" : "admin";

  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: addGroup
    })
  );

  await cognito.send(
    new AdminRemoveUserFromGroupCommand({
      UserPoolId: userPoolId,
      Username: username,
      GroupName: removeGroup
    })
  );
}
