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

export type ProfilePhotoInput = {
  key: string;
  contentType: string;
  sizeBytes: number;
};

export async function setProfilePhoto(db: DbClient, profileId: string, input: ProfilePhotoInput) {
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.id, profileId)
  });

  if (!existing) {
    throw notFound("Profile not found.");
  }

  const updated = await db
    .update(profiles)
    .set({
      profilePhotoKey: input.key,
      profilePhotoContentType: input.contentType,
      profilePhotoSizeBytes: input.sizeBytes,
      profilePhotoUpdatedAt: new Date(),
      updatedAt: new Date()
    })
    .where(eq(profiles.id, profileId))
    .returning();

  return {
    profile: mapProfile(updated[0]!),
    previousPhotoKey: existing.profilePhotoKey
  };
}

export async function clearProfilePhoto(db: DbClient, profileId: string) {
  const existing = await db.query.profiles.findFirst({
    where: eq(profiles.id, profileId)
  });

  if (!existing) {
    throw notFound("Profile not found.");
  }

  const updated = await db
    .update(profiles)
    .set({
      profilePhotoKey: null,
      profilePhotoContentType: null,
      profilePhotoSizeBytes: null,
      profilePhotoUpdatedAt: null,
      updatedAt: new Date()
    })
    .where(eq(profiles.id, profileId))
    .returning();

  return {
    profile: mapProfile(updated[0]!),
    previousPhotoKey: existing.profilePhotoKey
  };
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
