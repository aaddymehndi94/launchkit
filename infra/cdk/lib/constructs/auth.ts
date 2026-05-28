import { Duration } from "aws-cdk-lib";
import type { RemovalPolicy } from "aws-cdk-lib";
import * as cognito from "aws-cdk-lib/aws-cognito";
import { Construct } from "constructs";
import type { StageConfig } from "../config.js";

export class AuthConstruct extends Construct {
  readonly userPool: cognito.UserPool;
  readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, config: StageConfig, removalPolicy: RemovalPolicy) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: `launchkit-${config.stage}-users`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy,
      passwordPolicy: {
        minLength: 10,
        requireDigits: true,
        requireLowercase: true,
        requireUppercase: true,
        requireSymbols: false,
        tempPasswordValidity: Duration.days(7)
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true
        }
      }
    });

    this.userPoolClient = this.userPool.addClient("WebClient", {
      userPoolClientName: `launchkit-${config.stage}-web`,
      authFlows: {
        userPassword: true,
        userSrp: true
      },
      preventUserExistenceErrors: true
    });

    new cognito.CfnUserPoolGroup(this, "UserGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "user",
      precedence: 20
    });

    new cognito.CfnUserPoolGroup(this, "AdminGroup", {
      userPoolId: this.userPool.userPoolId,
      groupName: "admin",
      precedence: 10
    });
  }
}
