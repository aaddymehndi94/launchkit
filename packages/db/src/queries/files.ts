import { notFound } from "@launchkit/core";
import { and, desc, eq, sql } from "drizzle-orm";
import type { DbClient } from "../client.js";
import { mapFile } from "../mappers.js";
import { files } from "../schema.js";

export type CreateFileInput = {
  ownerProfileId: string;
  key: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
};

export async function createFileRecord(db: DbClient, input: CreateFileInput) {
  const inserted = await db.insert(files).values(input).returning();
  return mapFile(inserted[0]!);
}

export async function listFilesForProfile(db: DbClient, ownerProfileId: string) {
  const rows = await db
    .select()
    .from(files)
    .where(and(eq(files.ownerProfileId, ownerProfileId), eq(files.isDeleted, false)))
    .orderBy(desc(files.createdAt));

  return rows.map(mapFile);
}

export async function getOwnedFile(db: DbClient, ownerProfileId: string, fileId: string) {
  const row = await db.query.files.findFirst({
    where: and(eq(files.id, fileId), eq(files.ownerProfileId, ownerProfileId), eq(files.isDeleted, false))
  });

  if (!row) {
    throw notFound("File not found.");
  }

  return mapFile(row);
}

export async function softDeleteOwnedFile(db: DbClient, ownerProfileId: string, fileId: string) {
  const updated = await db
    .update(files)
    .set({ isDeleted: true, updatedAt: new Date() })
    .where(and(eq(files.id, fileId), eq(files.ownerProfileId, ownerProfileId), eq(files.isDeleted, false)))
    .returning();

  if (!updated[0]) {
    throw notFound("File not found.");
  }

  return mapFile(updated[0]);
}

export async function getFileStats(db: DbClient) {
  const rows = await db
    .select({
      count: sql<number>`count(*)::int`,
      bytes: sql<string>`coalesce(sum(${files.sizeBytes}), 0)::text`
    })
    .from(files)
    .where(eq(files.isDeleted, false));

  return {
    files: rows[0]?.count ?? 0,
    storageBytes: Number(rows[0]?.bytes ?? 0)
  };
}
