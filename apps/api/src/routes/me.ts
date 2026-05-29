import {
  profilePhotoPresignRequestSchema,
  profilePhotoSaveRequestSchema,
  updateProfileSchema
} from "@launchkit/contracts";
import { badRequest, success } from "@launchkit/core";
import { clearProfilePhoto, getDb, setProfilePhoto, updateProfile } from "@launchkit/db";
import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import {
  buildProfilePhotoKey,
  createInlineViewTarget,
  createUploadTarget,
  deleteStoredObject,
  isProfileOwnedObjectKey
} from "../services/storage.js";

export const meRoutes = new Hono<AppEnv>()
  .get("/", (c) => {
    return c.json(success(c.get("profile"), c.get("requestId")));
  })
  .get("/photo", async (c) => {
    const profile = c.get("profile");

    if (!profile.profilePhotoKey || !profile.profilePhotoContentType) {
      return c.json(
        success(
          {
            imageUrl: null,
            expiresInSeconds: null,
            contentType: null
          },
          c.get("requestId")
        )
      );
    }

    const target = await createInlineViewTarget(profile.profilePhotoKey, profile.profilePhotoContentType);

    return c.json(
      success(
        {
          imageUrl: target.downloadUrl,
          expiresInSeconds: target.expiresInSeconds,
          contentType: profile.profilePhotoContentType
        },
        c.get("requestId")
      )
    );
  })
  .post("/photo/presign", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = profilePhotoPresignRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw badRequest("Profile photo upload request is invalid.");
    }

    const profile = c.get("profile");
    const key = buildProfilePhotoKey(profile.id, parsed.data.filename);
    const uploadTarget = await createUploadTarget(key, parsed.data.contentType);

    return c.json(
      success(
        {
          key,
          ...uploadTarget
        },
        c.get("requestId")
      ),
      201
    );
  })
  .put("/photo", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = profilePhotoSaveRequestSchema.safeParse(body);

    if (!parsed.success) {
      throw badRequest("Profile photo update is invalid.");
    }

    const profile = c.get("profile");
    if (!isProfileOwnedObjectKey(profile.id, parsed.data.key)) {
      throw badRequest("Profile photo key is invalid.");
    }

    const result = await setProfilePhoto(getDb(), profile.id, parsed.data);

    if (result.previousPhotoKey && result.previousPhotoKey !== parsed.data.key) {
      await deleteStoredObject(result.previousPhotoKey);
    }

    return c.json(success(result.profile, c.get("requestId")));
  })
  .delete("/photo", async (c) => {
    const profile = c.get("profile");
    const result = await clearProfilePhoto(getDb(), profile.id);

    if (result.previousPhotoKey) {
      await deleteStoredObject(result.previousPhotoKey);
    }

    return c.json(success(result.profile, c.get("requestId")));
  })
  .put("/", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      throw badRequest("Profile update is invalid.");
    }

    const profile = c.get("profile");
    const updated = await updateProfile(getDb(), profile.id, parsed.data.displayName ?? null);

    return c.json(success(updated, c.get("requestId")));
  });
