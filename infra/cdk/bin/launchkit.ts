#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import { loadStageConfig } from "../lib/config.js";
import { LaunchKitStack } from "../lib/launchkit-stack.js";

const app = new App();
const stage = process.env.STAGE ?? app.node.tryGetContext("stage") ?? "dev";
const config = loadStageConfig(String(stage));

new LaunchKitStack(app, `LaunchKit-${config.stage}`, {
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? config.region
  }
});
