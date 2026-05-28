import { badRequest, forbidden, readOptionalEnv, success } from "@launchkit/core";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Hono } from "hono";
import type { AppEnv } from "../types.js";

const uploadRoot = path.resolve(process.cwd(), ".local", "uploads");

export const localUploadRoutes = new Hono<AppEnv>().put("/", async (c) => {
  if (readOptionalEnv("UPLOAD_BUCKET_NAME")) {
    throw forbidden("Local upload endpoint is disabled when S3 storage is configured.");
  }

  const key = c.req.query("key");
  if (!key) {
    throw badRequest("Missing upload key.");
  }

  const targetPath = path.resolve(uploadRoot, key);
  if (!targetPath.startsWith(uploadRoot)) {
    throw badRequest("Invalid upload key.");
  }

  await mkdir(path.dirname(targetPath), { recursive: true });
  await writeFile(targetPath, Buffer.from(await c.req.arrayBuffer()));

  return c.json(success({ ok: true }, c.get("requestId")));
});
