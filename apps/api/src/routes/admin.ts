import { adminRoleUpdateSchema } from "@launchkit/contracts";
import { badRequest, success } from "@launchkit/core";
import {
  getDb,
  getFileStats,
  listProfiles,
  setProfileRole,
  writeAudit
} from "@launchkit/db";
import { Hono } from "hono";
import type { AppEnv } from "../types.js";
import { syncCognitoGroups } from "../services/cognito.js";

export const adminRoutes = new Hono<AppEnv>()
  .get("/users", async (c) => {
    const users = await listProfiles(getDb());
    return c.json(success(users, c.get("requestId")));
  })
  .patch("/users/:id/role", async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = adminRoleUpdateSchema.safeParse(body);

    if (!parsed.success) {
      throw badRequest("Role update is invalid.");
    }

    const db = getDb();
    const updated = await setProfileRole(db, c.req.param("id"), parsed.data.role);
    await syncCognitoGroups(updated.cognitoSubject, updated.role);
    await writeAudit(db, {
      actorProfileId: c.get("profile").id,
      action: "profile.role.updated",
      targetType: "profile",
      targetId: updated.id,
      metadata: { role: updated.role }
    });

    return c.json(success(updated, c.get("requestId")));
  })
  .get("/metrics", async (c) => {
    const db = getDb();
    const users = await listProfiles(db);
    const fileStats = await getFileStats(db);

    return c.json(
      success(
        {
          users: users.length,
          files: fileStats.files,
          storageBytes: fileStats.storageBytes
        },
        c.get("requestId")
      )
    );
  });
