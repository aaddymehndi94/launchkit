import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["user", "admin"]);

export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cognitoSubject: varchar("cognito_subject", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    displayName: varchar("display_name", { length: 120 }),
    role: roleEnum("role").notNull().default("user"),
    profilePhotoKey: text("profile_photo_key"),
    profilePhotoContentType: varchar("profile_photo_content_type", { length: 120 }),
    profilePhotoSizeBytes: bigint("profile_photo_size_bytes", { mode: "number" }),
    profilePhotoUpdatedAt: timestamp("profile_photo_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    cognitoSubjectIdx: uniqueIndex("profiles_cognito_subject_idx").on(table.cognitoSubject),
    emailIdx: index("profiles_email_idx").on(table.email)
  })
);

export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ownerProfileId: uuid("owner_profile_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    key: text("s3_key").notNull(),
    filename: varchar("filename", { length: 240 }).notNull(),
    contentType: varchar("content_type", { length: 120 }).notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    isDeleted: boolean("is_deleted").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    keyIdx: uniqueIndex("files_s3_key_idx").on(table.key),
    ownerIdx: index("files_owner_profile_id_idx").on(table.ownerProfileId),
    deletedIdx: index("files_is_deleted_idx").on(table.isDeleted)
  })
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorProfileId: uuid("actor_profile_id").references(() => profiles.id, { onDelete: "set null" }),
    action: varchar("action", { length: 120 }).notNull(),
    targetType: varchar("target_type", { length: 120 }).notNull(),
    targetId: varchar("target_id", { length: 240 }).notNull(),
    metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow()
  },
  (table) => ({
    actorIdx: index("audit_logs_actor_profile_id_idx").on(table.actorProfileId),
    targetIdx: index("audit_logs_target_idx").on(table.targetType, table.targetId)
  })
);

export type ProfileRow = typeof profiles.$inferSelect;
export type NewProfileRow = typeof profiles.$inferInsert;
export type FileRow = typeof files.$inferSelect;
export type NewFileRow = typeof files.$inferInsert;
export type AuditLogRow = typeof auditLogs.$inferSelect;
export type NewAuditLogRow = typeof auditLogs.$inferInsert;
