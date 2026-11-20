import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireDb } from "@/db";
import { profiles, users } from "@/db/schema";

export async function GET() {
  const db = requireDb();
  const rows = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      slug: profiles.slug,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(
      and(eq(users.accountType, "professor"), eq(users.role, "user")),
    )
    .orderBy(asc(profiles.name));

  return NextResponse.json({ professors: rows });
}