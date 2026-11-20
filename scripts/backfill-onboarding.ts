import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL missing");
  const sql = neon(url);
  await sql`
    update profiles
    set onboarding_completed_at = coalesce(onboarding_completed_at, created_at)
    where onboarding_completed_at is null
  `;
  console.log("onboarding backfill ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
