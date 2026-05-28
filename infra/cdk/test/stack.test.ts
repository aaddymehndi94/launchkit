import { App } from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { describe, expect, it } from "vitest";
import { LaunchKitStack } from "../lib/launchkit-stack.js";

describe("LaunchKitStack", () => {
  it("synthesizes core serverless resources", () => {
    const app = new App();
    const stack = new LaunchKitStack(app, "TestStack", {
      config: {
        stage: "dev",
        region: "us-east-1",
        removalPolicy: "destroy",
        corsAllowedOrigins: ["http://localhost:5173"],
        logRetentionDays: 14
      }
    });

    const template = Template.fromStack(stack);
    template.resourceCountIs("AWS::Cognito::UserPool", 1);
    template.resourceCountIs("AWS::ApiGatewayV2::Api", 1);
    template.resourceCountIs("AWS::S3::Bucket", 2);
    template.hasResourceProperties("AWS::Lambda::Function", {
      FunctionName: "launchkit-dev-api"
    });
    template.hasResourceProperties("AWS::ApiGatewayV2::Route", {
      RouteKey: "PUT /{proxy+}",
      AuthorizationType: "JWT"
    });

    const routes = template.findResources("AWS::ApiGatewayV2::Route");
    expect(Object.values(routes)).not.toContainEqual(
      expect.objectContaining({
        Properties: expect.objectContaining({
          RouteKey: "ANY /{proxy+}"
        })
      })
    );

    expect(template.toJSON()).toBeDefined();
  });
});
