import type { FileRecord, Profile } from "@launchkit/contracts";
import type { FileRow, ProfileRow } from "./schema.js";

export function mapProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    cognitoSubject: row.cognitoSubject,
    email: row.email,
    displayName: row.displayName,
    role: row.role,
    profilePhotoKey: row.profilePhotoKey,
    profilePhotoContentType: row.profilePhotoContentType,
    profilePhotoSizeBytes: row.profilePhotoSizeBytes,
    profilePhotoUpdatedAt: row.profilePhotoUpdatedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

export function mapFile(row: FileRow): FileRecord {
  return {
    id: row.id,
    ownerProfileId: row.ownerProfileId,
    key: row.key,
    filename: row.filename,
    contentType: row.contentType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString()
  };
}
