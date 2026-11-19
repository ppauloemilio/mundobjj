CREATE TYPE "public"."account_type" AS ENUM('athlete', 'academy');--> statement-breakpoint
CREATE TYPE "public"."location_kind" AS ENUM('country', 'state', 'city');--> statement-breakpoint
CREATE TYPE "public"."suggestion_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "academy_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"city_text" text,
	"contact" text,
	"notes" text,
	"suggested_by_user_id" text,
	"status" "suggestion_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "location_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "location_kind" NOT NULL,
	"name" text NOT NULL,
	"country_iso2" text,
	"country_name" text,
	"state_id" uuid,
	"state_name" text,
	"suggested_by_user_id" text,
	"status" "suggestion_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "account_type" "account_type" DEFAULT 'athlete' NOT NULL;--> statement-breakpoint
ALTER TABLE "academy_suggestions" ADD CONSTRAINT "academy_suggestions_suggested_by_user_id_user_id_fk" FOREIGN KEY ("suggested_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_suggestions" ADD CONSTRAINT "location_suggestions_state_id_states_id_fk" FOREIGN KEY ("state_id") REFERENCES "public"."states"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "location_suggestions" ADD CONSTRAINT "location_suggestions_suggested_by_user_id_user_id_fk" FOREIGN KEY ("suggested_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;