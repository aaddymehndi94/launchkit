CREATE TYPE "public"."role" AS ENUM('user', 'admin');

CREATE TABLE "profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "cognito_subject" varchar(160) NOT NULL,
  "email" varchar(320) NOT NULL,
  "display_name" varchar(120),
  "role" "role" DEFAULT 'user' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "files" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "owner_profile_id" uuid NOT NULL,
  "s3_key" text NOT NULL,
  "filename" varchar(240) NOT NULL,
  "content_type" varchar(120) NOT NULL,
  "size_bytes" bigint NOT NULL,
  "is_deleted" boolean DEFAULT false NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "actor_profile_id" uuid,
  "action" varchar(120) NOT NULL,
  "target_type" varchar(120) NOT NULL,
  "target_id" varchar(240) NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "files"
  ADD CONSTRAINT "files_owner_profile_id_profiles_id_fk"
  FOREIGN KEY ("owner_profile_id") REFERENCES "public"."profiles"("id")
  ON DELETE cascade ON UPDATE no action;

ALTER TABLE "audit_logs"
  ADD CONSTRAINT "audit_logs_actor_profile_id_profiles_id_fk"
  FOREIGN KEY ("actor_profile_id") REFERENCES "public"."profiles"("id")
  ON DELETE set null ON UPDATE no action;

CREATE UNIQUE INDEX "profiles_cognito_subject_idx" ON "profiles" USING btree ("cognito_subject");
CREATE INDEX "profiles_email_idx" ON "profiles" USING btree ("email");
CREATE UNIQUE INDEX "files_s3_key_idx" ON "files" USING btree ("s3_key");
CREATE INDEX "files_owner_profile_id_idx" ON "files" USING btree ("owner_profile_id");
CREATE INDEX "files_is_deleted_idx" ON "files" USING btree ("is_deleted");
CREATE INDEX "audit_logs_actor_profile_id_idx" ON "audit_logs" USING btree ("actor_profile_id");
CREATE INDEX "audit_logs_target_idx" ON "audit_logs" USING btree ("target_type", "target_id");
