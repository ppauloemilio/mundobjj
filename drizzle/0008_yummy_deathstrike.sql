CREATE TABLE "professor_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"academy_id" uuid,
	"academy_name" text,
	"contact" text,
	"notes" text,
	"suggested_by_user_id" text,
	"status" "suggestion_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "professor_suggestions" ADD CONSTRAINT "professor_suggestions_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "public"."academies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor_suggestions" ADD CONSTRAINT "professor_suggestions_suggested_by_user_id_user_id_fk" FOREIGN KEY ("suggested_by_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;