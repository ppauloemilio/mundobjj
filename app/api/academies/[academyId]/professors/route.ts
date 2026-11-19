import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireDb } from "@/db";
import { academyProfessors, profiles } from "@/db/schema";

export async function GET(
  _request: Request,
  context: { params: Promise<{ academyId: string }> },
) {
  const { academyId } = await context.params;
  if (!academyId) {
    return NextResponse.json({ professors: [] });
  }

  const db = requireDb();
  const rows = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      slug: profiles.slug,
    })
    .from(academyProfessors)
    .innerJoin(profiles, eq(academyProfessors.professorProfileId, profiles.id))
    .where(
      and(
        eq(academyProfessors.academyId, academyId),
        eq(academyProfessors.status, "active"),
      ),
    )
    .orderBy(asc(profiles.name));

  return NextResponse.json({ professors: rows });
}