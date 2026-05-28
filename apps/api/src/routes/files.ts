import { presignUploadRequestSchema } from "@launchkit/contracts";
import { badRequest, success } from "@launchkit/core";
import { createFileRecord, getDb, getOwnedFile, listFilesForProfile, softDeleteOwnedFile } from "@launchkit/db";
import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import {
  buildObjectKey,
  createDownloadTarget,
  createUploadTarget,
  deleteStoredObject
} from "../services/storage.js";

export const fileRoutes = new Hono<AppEnv>()
  .get("/", async (c) => {
    const profile = c.get("profile");
    const files = await listFilesForProfile(getDb(), profile.id);

    return c.json(success(files, c.get("requestId")));
  })
  .post("/presign", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = presignUploadRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw badRequest("Upload request is invalid.");
    }

    const profile = c.get("profile");
    const key = buildObjectKey(profile.id, parsed.data.filename);
    const file = await createFileRecord(getDb(), {
      ownerProfileId: profile.id,
      key,
      filename: parsed.data.filename,
      contentType: parsed.data.contentType,
      sizeBytes: parsed.data.sizeBytes
    });

    const uploadTarget = await createUploadTarget(key, parsed.data.contentType);

    return c.json(
      success(
        {
          file,
          ...uploadTarget
        },
        c.get("requestId")
      ),
      201
    );
  })
  .get("/:id/download", async (c) => {
    const profile = c.get("profile");
    const file = await getOwnedFile(getDb(), profile.id, c.req.param("id"));
    const target = await createDownloadTarget(file.key, file.filename, file.contentType);

    return c.json(
      success(
        {
          file,
          ...target
        },
        c.get("requestId")
      )
    );
  })
  .delete("/:id", async (c) => {
    const profile = c.get("profile");
    const file = await softDeleteOwnedFile(getDb(), profile.id, c.req.param("id"));
    await deleteStoredObject(file.key);

    return c.json(success(file, c.get("requestId")));
  });
