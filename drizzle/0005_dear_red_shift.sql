ALTER TABLE "academies" ADD COLUMN "claim_token" text;--> statement-breakpoint
ALTER TABLE "academies" ADD COLUMN "claimed_at" timestamp;--> statement-breakpoint
ALTER TABLE "academies" ADD CONSTRAINT "academies_claim_token_unique" UNIQUE("claim_token");