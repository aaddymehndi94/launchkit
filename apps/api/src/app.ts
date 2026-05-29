import { readEnv } from "@launchkit/core";
import { cors } from "hono/cors";
import { Hono } from "hono";
import { adminRoutes } from "./routes/admin.js";
import { errorHandler } from "./middleware/errors.js";
import { fileRoutes } from "./routes/files.js";
import { healthRoutes } from "./routes/health.js";
import { localUploadRoutes } from "./routes/local-upload.js";
import { meRoutes } from "./routes/me.js";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { requireAdmin, requireAuth } from "./middleware/auth.js";
import type { AppEnv } from "./types.js";

export function createApp() {
  const app = new Hono<AppEnv>();
  const stage = readEnv("STAGE", "local");
  const allowedOrigins = readEnv("CORS_ALLOWED_ORIGINS", "*")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use("*", requestIdMiddleware);
  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (allowedOrigins.includes("*")) {
          return origin || "*";
        }

        if (!origin) {
          return allowedOrigins[0] ?? "*";
        }

        if (stage === "local" && isTrustedLocalOrigin(origin)) {
          return origin;
        }

        return allowedOrigins.includes(origin) ? origin : "";
      },
      allowHeaders: [
        "authorization",
        "content-type",
        "x-request-id",
        "x-launchkit-user-id",
        "x-launchkit-email",
        "x-launchkit-role"
      ],
      allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      credentials: false
    })
  );

  app.onError(errorHandler);

  app.route("/health", healthRoutes);
  app.route("/local-upload", localUploadRoutes);

  app.use("/me", requireAuth);
  app.use("/me/*", requireAuth);
  app.route("/me", meRoutes);

  app.use("/files", requireAuth);
  app.use("/files/*", requireAuth);
  app.route("/files", fileRoutes);

  app.use("/admin", requireAuth, requireAdmin);
  app.use("/admin/*", requireAuth, requireAdmin);
  app.route("/admin", adminRoutes);

  return app;
}

export const app = createApp();

function isTrustedLocalOrigin(origin: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}
