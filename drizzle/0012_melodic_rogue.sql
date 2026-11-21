CREATE TYPE "public"."competition_age_class" AS ENUM('ADULT', 'MASTER1', 'MASTER2', 'MASTER3', 'MASTER4', 'MASTER5', 'MASTER6', 'MASTER7', 'JUVENILE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."competition_federation" AS ENUM('CBJJ', 'IBJJF', 'CBJJO', 'STATE', 'LOCAL', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."competition_modality" AS ENUM('GI', 'NOGI');--> statement-breakpoint
CREATE TYPE "public"."competition_result" AS ENUM('GOLD', 'SILVER', 'BRONZE', 'PARTICIPATED');--> statement-breakpoint
CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"name" text NOT NULL,
	"event_date" date NOT NULL,
	"city" text,
	"country_code" text,
	"federation" "competition_federation" DEFAULT 'OTHER' NOT NULL,
	"belt" text NOT NULL,
	"weight_class" text,
	"age_class" "competition_age_class" DEFAULT 'ADULT' NOT NULL,
	"modality" "competition_modality" DEFAULT 'GI' NOT NULL,
	"is_absolute" boolean DEFAULT false NOT NULL,
	"result" "competition_result" NOT NULL,
	"podium_photo_url" text,
	"bracket_url" text,
	"hidden" boolean DEFAULT false NOT NULL,
	"verified_by_professor_id" uuid,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_verified_by_professor_id_profiles_id_fk" FOREIGN KEY ("verified_by_professor_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competitions_profile_idx" ON "competitions" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "competitions_profile_date_idx" ON "competitions" USING btree ("profile_id","event_date" DESC NULLS LAST);