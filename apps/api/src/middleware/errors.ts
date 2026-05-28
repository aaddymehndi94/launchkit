import { failure, isAppError, log } from "@launchkit/core";
import type { ErrorHandler } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { AppEnv } from "../types.js";

export const errorHandler: ErrorHandler<AppEnv> = (error, c) => {
  const requestId = c.get("requestId") ?? "unknown";

  if (isAppError(error)) {
    if (error.statusCode >= 500) {
      log("error", error.message, { requestId, code: error.code, cause: error.cause });
    }

    return c.json(
      failure(error.code, error.expose ? error.message : "Unexpected server error.", requestId),
      {
        status: error.statusCode as ContentfulStatusCode
      }
    );
  }

  log("error", "Unhandled API error", {
    requestId,
    message: error instanceof Error ? error.message : String(error)
  });

  return c.json(failure("INTERNAL_SERVER_ERROR", "Unexpected server error.", requestId), {
    status: 500
  });
};
