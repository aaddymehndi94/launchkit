import { updateProfileSchema } from "@launchkit/contracts";
import { badRequest, success } from "@launchkit/core";
import { getDb, updateProfile } from "@launchkit/db";
import { Hono } from "hono";
import type { AppEnv } from "../types.js";

export const meRoutes = new Hono<AppEnv>()
  .get("/", (c) => {
    return c.json(success(c.get("profile"), c.get("requestId")));
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
