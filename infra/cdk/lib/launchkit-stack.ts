import { CfnOutput, RemovalPolicy, Stack, Tags, type StackProps } from "aws-cdk-lib";
import * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import type { Construct } from "constructs";
import type { StageConfig } from "./config.js";
import { ApiConstruct } from "./constructs/api.js";
import { AuthConstruct } from "./constructs/auth.js";
import { FrontendConstruct } from "./constructs/frontend.js";
import { ObservabilityConstruct } from "./constructs/observability.js";
import { StorageConstruct } from "./constructs/storage.js";

export type LaunchKitStackProps = StackProps & {
  config: StageConfig;
};

export class LaunchKitStack extends Stack {
  constructor(scope: Construct, id: string, props: LaunchKitStackProps) {
    super(scope, id, props);

    const removalPolicy =
      props.config.removalPolicy === "destroy" ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN;

    Tags.of(this).add("Application", "LaunchKit");
    Tags.of(this).add("Stage", props.config.stage);

    const auth = new AuthConstruct(this, "Auth", props.config, removalPolicy);
    const storage = new StorageConstruct(this, "Storage", props.config, removalPolicy);

    const appSecret = new secretsmanager.Secret(this, "AppSecret", {
      secretName: `/launchkit/${props.config.stage}/app`,
      description: `LaunchKit ${props.config.stage} application secrets`,
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          DATABASE_URL: "replace-me",
          DATABASE_SSL: "true"
        }),
        generateStringKey: "SETUP_TOKEN",
        excludePunctuation: true
      },
      removalPolicy
    });

    const api = new ApiConstruct(this, "Api", {
      config: props.config,
      userPool: auth.userPool,
      userPoolClient: auth.userPoolClient,
      uploadBucket: storage.uploadBucket,
      appSecret
    });

    const frontend = new FrontendConstruct(this, "Frontend", {
      config: props.config,
      frontendBucket: storage.frontendBucket,
      apiUrl: api.api.apiEndpoint,
      userPool: auth.userPool,
      userPoolClient: auth.userPoolClient
    });

    new ObservabilityConstruct(this, "Observability", {
      config: props.config,
      api: api.api,
      handler: api.handler
    });

    new CfnOutput(this, "ApiUrl", { value: api.api.apiEndpoint });
    new CfnOutput(this, "FrontendUrl", {
      value: `https://${frontend.distribution.distributionDomainName}`
    });
    new CfnOutput(this, "UserPoolId", { value: auth.userPool.userPoolId });
    new CfnOutput(this, "UserPoolClientId", { value: auth.userPoolClient.userPoolClientId });
    new CfnOutput(this, "AppSecretName", { value: appSecret.secretName });
    new CfnOutput(this, "UploadBucketName", { value: storage.uploadBucket.bucketName });
  }
}
