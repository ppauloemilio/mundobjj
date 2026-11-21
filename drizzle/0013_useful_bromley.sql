ALTER TABLE "academies" ADD COLUMN "suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "academy_suggestions" ADD COLUMN "academy_id" uuid;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "blocked_at" timestamp;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "academy_suggestions" ADD CONSTRAINT "academy_suggestions_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "public"."academies"("id") ON DELETE set null ON UPDATE no action;