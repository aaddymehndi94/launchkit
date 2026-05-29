ALTER TABLE "profiles" ADD COLUMN "profile_photo_key" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "profile_photo_content_type" varchar(120);--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "profile_photo_size_bytes" bigint;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "profile_photo_updated_at" timestamp with time zone;