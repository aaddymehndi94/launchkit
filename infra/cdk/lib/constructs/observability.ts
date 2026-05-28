import * as cloudwatch from "aws-cdk-lib/aws-cloudwatch";
import type * as apigwv2 from "aws-cdk-lib/aws-apigatewayv2";
import type * as lambda from "aws-cdk-lib/aws-lambda";
import { Construct } from "constructs";
import type { StageConfig } from "../config.js";

export class ObservabilityConstruct extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: {
      config: StageConfig;
      api: apigwv2.HttpApi;
      handler: lambda.Function;
    }
  ) {
    super(scope, id);

    const apiCount = new cloudwatch.Metric({
      namespace: "AWS/ApiGateway",
      metricName: "Count",
      dimensionsMap: {
        ApiId: props.api.apiId
      },
      statistic: "Sum"
    });

    new cloudwatch.Dashboard(this, "Dashboard", {
      dashboardName: `launchkit-${props.config.stage}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: "API Requests",
            left: [apiCount],
            width: 12
          }),
          new cloudwatch.GraphWidget({
            title: "Lambda Errors",
            left: [props.handler.metricErrors()],
            width: 12
          })
        ],
        [
          new cloudwatch.GraphWidget({
            title: "Lambda Duration",
            left: [props.handler.metricDuration()],
            width: 12
          }),
          new cloudwatch.GraphWidget({
            title: "Lambda Invocations",
            left: [props.handler.metricInvocations()],
            width: 12
          })
        ]
      ]
    });
  }
}
