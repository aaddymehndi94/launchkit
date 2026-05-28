import type { AuthContext, UserRole } from "@launchkit/core";
import { notFound } from "@launchkit/core";
import { desc, eq } from "drizzle-orm";
import type { DbClient } from "../client.js";
import { mapProfile } from "../mappers.js";
import { profiles } from "../schema.js";

export async function ensureProfileForAuth(db: DbClient, auth: AuthContext) {
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.cognitoSubject, auth.subject)
  });

  if (existing) {
    return mapProfile(existing);
  }

  const inserted = await db
    .insert(profiles)
    .values({
      cognitoSubject: auth.subject,
      email: auth.email,
      role: auth.role
    })
    .returning();

  return mapProfile(inserted[0]!);
}

export async function updateProfile(db: DbClient, profileId: string, displayName: string | null) {
  const updated = await db
    .update(profiles)
    .set({ displayName, updatedAt: new Date() })
    .where(eq(profiles.id, profileId))
    .returning();

  if (!updated[0]) {
    throw notFound("Profile not found.");
  }

  return mapProfile(updated[0]);
}

export async function listProfiles(db: DbClient) {
  const rows = await db.select().from(profiles).orderBy(desc(profiles.createdAt));
  return rows.map(mapProfile);
}

export async function setProfileRole(db: DbClient, profileId: string, role: UserRole) {
  const updated = await db
    .update(profiles)
    .set({ role, updatedAt: new Date() })
    .where(eq(profiles.id, profileId))
    .returning();

  if (!updated[0]) {
    throw notFound("Profile not found.");
  }

  return mapProfile(updated[0]);
}
