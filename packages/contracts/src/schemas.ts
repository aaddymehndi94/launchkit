import { z } from "zod";

export const roleSchema = z.enum(["user", "admin"]);
export const profilePhotoContentTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export const maxProfilePhotoBytes = 5 * 1024 * 1024;

export const profileSchema = z.object({
  id: z.string().uuid(),
  cognitoSubject: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().nullable(),
  role: roleSchema,
  profilePhotoKey: z.string().nullable(),
  profilePhotoContentType: z.string().nullable(),
  profilePhotoSizeBytes: z.number().int().nonnegative().nullable(),
  profilePhotoUpdatedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(120).nullable().optional()
});

export const fileRecordSchema = z.object({
  id: z.string().uuid(),
  ownerProfileId: z.string().uuid(),
  key: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  createdAt: z.string()
});

export const presignUploadRequestSchema = z.object({
  filename: z.string().trim().min(1).max(240),
  contentType: z.string().trim().min(1).max(120),
  sizeBytes: z.number().int().positive().max(25 * 1024 * 1024)
});

export const presignUploadResponseSchema = z.object({
  file: fileRecordSchema,
  uploadUrl: z.string().url(),
  method: z.literal("PUT"),
  headers: z.record(z.string())
});

export const fileDownloadResponseSchema = z.object({
  file: fileRecordSchema,
  downloadUrl: z.string().url(),
  expiresInSeconds: z.number().int().positive()
});

export const profilePhotoPresignRequestSchema = z.object({
  filename: z.string().trim().min(1).max(240),
  contentType: z.enum(profilePhotoContentTypes),
  sizeBytes: z.number().int().positive().max(maxProfilePhotoBytes)
});

export const profilePhotoSaveRequestSchema = z.object({
  key: z.string().min(1),
  contentType: z.enum(profilePhotoContentTypes),
  sizeBytes: z.number().int().positive().max(maxProfilePhotoBytes)
});

export const profilePhotoPresignResponseSchema = z.object({
  key: z.string().min(1),
  uploadUrl: z.string().url(),
  method: z.literal("PUT"),
  headers: z.record(z.string())
});

export const profilePhotoViewResponseSchema = z.object({
  imageUrl: z.string().url().nullable(),
  expiresInSeconds: z.number().int().positive().nullable(),
  contentType: z.string().nullable()
});

export const adminRoleUpdateSchema = z.object({
  role: roleSchema
});

export const adminMetricsSchema = z.object({
  users: z.number().int().nonnegative(),
  files: z.number().int().nonnegative(),
  storageBytes: z.number().int().nonnegative()
});

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string()
  }),
  requestId: z.string()
});

export function apiSuccessSchema<T extends z.ZodTypeAny>(data: T) {
  return z.object({
    data,
    requestId: z.string()
  });
}

export type UserRole = z.infer<typeof roleSchema>;
export type Profile = z.infer<typeof profileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type FileRecord = z.infer<typeof fileRecordSchema>;
export type PresignUploadInput = z.infer<typeof presignUploadRequestSchema>;
export type PresignUploadResponse = z.infer<typeof presignUploadResponseSchema>;
export type FileDownloadResponse = z.infer<typeof fileDownloadResponseSchema>;
export type ProfilePhotoPresignInput = z.infer<typeof profilePhotoPresignRequestSchema>;
export type ProfilePhotoSaveInput = z.infer<typeof profilePhotoSaveRequestSchema>;
export type ProfilePhotoPresignResponse = z.infer<typeof profilePhotoPresignResponseSchema>;
export type ProfilePhotoViewResponse = z.infer<typeof profilePhotoViewResponseSchema>;
export type AdminMetrics = z.infer<typeof adminMetricsSchema>;
