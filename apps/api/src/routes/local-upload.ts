import { badRequest, forbidden, readOptionalEnv, success } from "@launchkit/core";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { Hono } from "hono";
import type { AppEnv } from "../types.js";

const uploadRoot = path.resolve(process.cwd(), ".local", "uploads");

export const localUploadRoutes = new Hono<AppEnv>()
  .put("/", async (c) => {
    if (readOptionalEnv("UPLOAD_BUCKET_NAME")) {
      throw forbidden("Local upload endpoint is disabled when S3 storage is configured.");
    }

    const targetPath = resolveLocalUploadPath(c.req.query("key"));

    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, Buffer.from(await c.req.arrayBuffer()));

    return c.json(success({ ok: true }, c.get("requestId")));
  })
  .get("/", async (c) => {
    if (readOptionalEnv("UPLOAD_BUCKET_NAME")) {
      throw forbidden("Local upload endpoint is disabled when S3 storage is configured.");
    }

    const targetPath = resolveLocalUploadPath(c.req.query("key"));
    const filename = c.req.query("filename") ?? "download";
    const contentType = c.req.query("contentType") ?? "application/octet-stream";
    const body = await readFile(targetPath);

    return new Response(body, {
      headers: {
        "content-type": contentType,
        "content-disposition": `attachment; filename="${filename.replaceAll('"', "")}"`
      }
    });
  });

function resolveLocalUploadPath(key: string | undefined): string {
  if (readOptionalEnv("UPLOAD_BUCKET_NAME")) {
    throw forbidden("Local upload endpoint is disabled when S3 storage is configured.");
  }

  if (!key) {
    throw badRequest("Missing upload key.");
  }

  const targetPath = path.resolve(uploadRoot, key);
  const relativePath = path.relative(uploadRoot, targetPath);
  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw badRequest("Invalid upload key.");
  }

  return targetPath;
}
