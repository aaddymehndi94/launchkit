import { z } from "zod";

export const roleSchema = z.enum(["user", "admin"]);

export const profileSchema = z.object({
  id: z.string().uuid(),
  cognitoSubject: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().nullable(),
  role: roleSchema,
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
export type AdminMetrics = z.infer<typeof adminMetricsSchema>;
