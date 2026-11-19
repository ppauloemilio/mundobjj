import { config } from "dotenv";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { profiles, users } from "./schema";
import { uniqueSlug } from "../lib/slug";

config({ path: ".env.local" });
config();

async function main() {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  const email = (process.env.ADMIN_EMAIL || "admin@mundobjj.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Admin Mundo BJJ";

  if (!url) {
    throw new Error("Defina DATABASE_URL_UNPOOLED ou DATABASE_URL.");
  }
  if (!password || password.length < 8) {
    throw new Error("Defina ADMIN_PASSWORD com ao menos 8 caracteres no .env.local.");
  }

  const db = drizzle(neon(url));
  const passwordHash = await hash(password, 10);

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    await db
      .update(users)
      .set({
        name,
        passwordHash,
        role: "admin",
        accountType: "athlete",
        blockedAt: null,
      })
      .where(eq(users.id, existing.id));
    console.log(`Admin atualizado: ${email}`);
    return;
  }

  const userId = crypto.randomUUID();
  await db.insert(users).values({
    id: userId,
    name,
    email,
    passwordHash,
    role: "admin",
    accountType: "athlete",
  });
  await db.insert(profiles).values({
    userId,
    name,
    slug: uniqueSlug("admin"),
  });
  console.log(`Admin criado: ${email}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
