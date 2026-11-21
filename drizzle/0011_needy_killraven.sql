CREATE TYPE "public"."weight_category" AS ENUM('feather', 'light', 'middle', 'medium_heavy', 'heavy', 'super_heavy', 'ultra_heavy');--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "weight_category" "weight_category";--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "avatar_url" text;