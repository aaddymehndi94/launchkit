import { existsSync } from "node:fs";
import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import * as authorizers from "aws-cdk-lib/aws-apigatewayv2-authorizers";
import * as integrations from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as lambdaNode from "aws-cdk-lib/aws-lambda-nodejs";
import * as logs from "aws-cdk-lib/aws-logs";
import type * as cognito from "aws-cdk-lib/aws-cognito";
import type * as s3 from "aws-cdk-lib/aws-s3";
import type * as secretsmanager from "aws-cdk-lib/aws-secretsmanager";
import { Construct } from "constructs";
import type { StageConfig } from "../config.js";
import { apiEntry, pnpmLock } from "../paths.js";

export class ApiConstruct extends Construct {
  readonly api: apigwv2.HttpApi;
  readonly handler: lambdaNode.NodejsFunction;

  constructor(
    scope: Construct,
    id: string,
    props: {
      config: StageConfig;
      userPool: cognito.UserPool;
      userPoolClient: cognito.UserPoolClient;
      uploadBucket: s3.Bucket;
      appSecret: secretsmanager.Secret;
    }
  ) {
    super(scope, id);

    const functionName = `launchkit-${props.config.stage}-api`;
    const logGroup = new logs.LogGroup(this, "HandlerLogGroup", {
      logGroupName: `/aws/lambda/${functionName}`,
      retention: retentionFromDays(props.config.logRetentionDays),
      removalPolicy:
        props.config.removalPolicy === "destroy" ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN
    });

    this.handler = new lambdaNode.NodejsFunction(this, "Handler", {
      functionName,
      entry: apiEntry,
      handler: "handler",
      runtime: lambda.Runtime.NODEJS_24_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 256,
      timeout: Duration.seconds(12),
      logGroup,
      ...(existsSync(pnpmLock) ? { depsLockFilePath: pnpmLock } : {}),
      environment: {
        STAGE: props.config.stage,
        AUTH_MODE: "cognito",
        APP_SECRET_ARN: props.appSecret.secretArn,
        UPLOAD_BUCKET_NAME: props.uploadBucket.bucketName,
        COGNITO_USER_POOL_ID: props.userPool.userPoolId,
        CORS_ALLOWED_ORIGINS: props.config.corsAllowedOrigins.join(",")
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: "node24"
      }
    });

    props.appSecret.grantRead(this.handler);
    props.uploadBucket.grantReadWrite(this.handler);
    this.handler.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ["cognito-idp:AdminAddUserToGroup", "cognito-idp:AdminRemoveUserFromGroup"],
        resources: [props.userPool.userPoolArn]
      })
    );

    this.api = new apigwv2.HttpApi(this, "HttpApi", {
      apiName: `launchkit-${props.config.stage}-api`,
      corsPreflight: {
        allowOrigins: props.config.corsAllowedOrigins.length ? props.config.corsAllowedOrigins : ["*"],
        allowHeaders: [
          "authorization",
          "content-type",
          "x-request-id",
          "x-launchkit-user-id",
          "x-launchkit-email",
          "x-launchkit-role"
        ],
        allowMethods: [
          apigwv2.CorsHttpMethod.GET,
          apigwv2.CorsHttpMethod.POST,
          apigwv2.CorsHttpMethod.PUT,
          apigwv2.CorsHttpMethod.PATCH,
          apigwv2.CorsHttpMethod.DELETE,
          apigwv2.CorsHttpMethod.OPTIONS
        ],
        allowCredentials: false
      }
    });

    const integration = new integrations.HttpLambdaIntegration("ApiIntegration", this.handler);
    const authorizer = new authorizers.HttpJwtAuthorizer(
      "CognitoJwtAuthorizer",
      `https://cognito-idp.${Stack.of(this).region}.amazonaws.com/${props.userPool.userPoolId}`,
      {
        jwtAudience: [props.userPoolClient.userPoolClientId]
      }
    );

    this.api.addRoutes({
      path: "/health",
      methods: [apigwv2.HttpMethod.GET],
      integration
    });

    this.api.addRoutes({
      path: "/{proxy+}",
      methods: [
        apigwv2.HttpMethod.GET,
        apigwv2.HttpMethod.POST,
        apigwv2.HttpMethod.PUT,
        apigwv2.HttpMethod.PATCH,
        apigwv2.HttpMethod.DELETE
      ],
      integration,
      authorizer
    });
  }
}

function retentionFromDays(days: number): logs.RetentionDays {
  if (days <= 14) {
    return logs.RetentionDays.TWO_WEEKS;
  }

  if (days <= 90) {
    return logs.RetentionDays.THREE_MONTHS;
  }

  return logs.RetentionDays.ONE_YEAR;
}
