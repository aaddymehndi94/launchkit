import { readEnv, success } from "@launchkit/core";
import { Hono } from "hono";
import type { AppEnv } from "../types.js";

export const healthRoutes = new Hono<AppEnv>().get("/", (c) => {
  return c.json(
    success(
      {
        ok: true,
        service: "launchkit-api",
        stage: readEnv("STAGE", "local")
      },
      c.get("requestId")
    )
  );
});
