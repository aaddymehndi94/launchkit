import { createId } from "@launchkit/core";
import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types.js";

export const requestIdMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {
  const requestId = c.req.header("x-request-id") ?? createId();
  c.set("requestId", requestId);

  await next();

  c.res.headers.set("x-request-id", requestId);
};
