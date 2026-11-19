import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { requireDb } from "@/db";
import { academies, profiles } from "@/db/schema";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/entrar");
  }
  return session.user;
}

export async function getProfileForUser(userId: string) {
  const db = requireDb();
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  return profile ?? null;
}

export async function getOwnedAcademies(userId: string) {
  const db = requireDb();
  return db.select().from(academies).where(eq(academies.ownerId, userId));
}
