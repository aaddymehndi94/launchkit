import { Duration } from "aws-cdk-lib";
import type { RemovalPolicy } from "aws-cdk-lib";
import * as s3 from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import type { StageConfig } from "../config.js";

export class StorageConstruct extends Construct {
  readonly uploadBucket: s3.Bucket;
  readonly frontendBucket: s3.Bucket;

  constructor(scope: Construct, id: string, config: StageConfig, removalPolicy: RemovalPolicy) {
    super(scope, id);

    const autoDeleteObjects = config.removalPolicy === "destroy";

    this.uploadBucket = new s3.Bucket(this, "UploadBucket", {
      bucketName: undefined,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.GET, s3.HttpMethods.DELETE],
          allowedOrigins: config.corsAllowedOrigins.length ? config.corsAllowedOrigins : ["*"],
          allowedHeaders: ["*"],
          maxAge: 300
        }
      ],
      lifecycleRules: [
        {
          id: "abort-incomplete-multipart",
          abortIncompleteMultipartUploadAfter: Duration.days(7)
        }
      ]
    });

    this.frontendBucket = new s3.Bucket(this, "FrontendBucket", {
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy,
      autoDeleteObjects
    });
  }
}
