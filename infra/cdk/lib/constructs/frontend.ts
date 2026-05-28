import { existsSync } from "node:fs";
import { Duration, RemovalPolicy, Stack } from "aws-cdk-lib";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import * as s3deploy from "aws-cdk-lib/aws-s3-deployment";
import type * as cognito from "aws-cdk-lib/aws-cognito";
import type * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import type { StageConfig } from "../config.js";
import { webDist } from "../paths.js";

export class FrontendConstruct extends Construct {
  readonly distribution: cloudfront.Distribution;

  constructor(
    scope: Construct,
    id: string,
    props: {
      config: StageConfig;
      frontendBucket: s3.Bucket;
      apiUrl: string;
      userPool: cognito.UserPool;
      userPoolClient: cognito.UserPoolClient;
    }
  ) {
    super(scope, id);

    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      comment: `LaunchKit ${props.config.stage} frontend`,
      defaultRootObject: "index.html",
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(props.frontendBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(5)
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
          ttl: Duration.minutes(5)
        }
      ]
    });

    const runtimeConfig = {
      apiUrl: props.apiUrl,
      authMode: "cognito",
      awsRegion: Stack.of(this).region,
      userPoolId: props.userPool.userPoolId,
      userPoolClientId: props.userPoolClient.userPoolClientId
    };

    new s3deploy.BucketDeployment(this, "DeployFrontend", {
      destinationBucket: props.frontendBucket,
      distribution: this.distribution,
      distributionPaths: ["/*"],
      retainOnDelete: props.config.removalPolicy === "retain",
      prune: true,
      sources: existsSync(webDist)
        ? [
            s3deploy.Source.asset(webDist),
            s3deploy.Source.data("config/runtime.json", JSON.stringify(runtimeConfig, null, 2))
          ]
        : [
            s3deploy.Source.data(
              "index.html",
              "<!doctype html><html><body><h1>Build apps/web before deploying LaunchKit.</h1></body></html>"
            ),
            s3deploy.Source.data("config/runtime.json", JSON.stringify(runtimeConfig, null, 2))
          ]
    });

    props.frontendBucket.applyRemovalPolicy(
      props.config.removalPolicy === "destroy" ? RemovalPolicy.DESTROY : RemovalPolicy.RETAIN
    );
  }
}
