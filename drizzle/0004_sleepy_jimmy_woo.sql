ALTER TYPE "public"."account_type" ADD VALUE 'professor';--> statement-breakpoint
CREATE TABLE "academy_professors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academy_id" uuid NOT NULL,
	"professor_profile_id" uuid NOT NULL,
	"status" "membership_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "athlete_professors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"professor_profile_id" uuid NOT NULL,
	"academy_id" uuid NOT NULL,
	"status" "membership_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "class_schedules" ADD COLUMN "professor_profile_id" uuid;--> statement-breakpoint
ALTER TABLE "academy_professors" ADD CONSTRAINT "academy_professors_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "public"."academies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academy_professors" ADD CONSTRAINT "academy_professors_professor_profile_id_profiles_id_fk" FOREIGN KEY ("professor_profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_professors" ADD CONSTRAINT "athlete_professors_profile_id_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_professors" ADD CONSTRAINT "athlete_professors_professor_profile_id_profiles_id_fk" FOREIGN KEY ("professor_profile_id") REFERENCES "public"."profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "athlete_professors" ADD CONSTRAINT "athlete_professors_academy_id_academies_id_fk" FOREIGN KEY ("academy_id") REFERENCES "public"."academies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academy_professors_academy_professor_idx" ON "academy_professors" USING btree ("academy_id","professor_profile_id");--> statement-breakpoint
CREATE INDEX "academy_professors_academy_idx" ON "academy_professors" USING btree ("academy_id");--> statement-breakpoint
CREATE UNIQUE INDEX "athlete_professors_profile_academy_idx" ON "athlete_professors" USING btree ("profile_id","academy_id");--> statement-breakpoint
CREATE INDEX "athlete_professors_profile_idx" ON "athlete_professors" USING btree ("profile_id");--> statement-breakpoint
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_professor_profile_id_profiles_id_fk" FOREIGN KEY ("professor_profile_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;