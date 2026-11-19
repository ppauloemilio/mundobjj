import { and, eq } from "drizzle-orm";
import type { requireDb } from "@/db";
import {
  academyProfessors,
  athleteProfessors,
} from "@/db/schema";

type Db = ReturnType<typeof requireDb>;

export async function saveAthleteProfessorLink(
  db: Db,
  input: {
    profileId: string;
    academyId: string;
    professorProfileId: string;
  },
): Promise<{ error?: string }> {
  const { profileId, academyId, professorProfileId } = input;
  if (!professorProfileId) return {};

  const [linked] = await db
    .select({ id: academyProfessors.id })
    .from(academyProfessors)
    .where(
      and(
        eq(academyProfessors.academyId, academyId),
        eq(academyProfessors.professorProfileId, professorProfileId),
        eq(academyProfessors.status, "active"),
      ),
    )
    .limit(1);

  if (!linked) {
    return { error: "Este professor não está vinculado à academia selecionada." };
  }

  await db
    .update(athleteProfessors)
    .set({ status: "left" })
    .where(
      and(
        eq(athleteProfessors.profileId, profileId),
        eq(athleteProfessors.academyId, academyId),
        eq(athleteProfessors.status, "active"),
      ),
    );

  const [existing] = await db
    .select({ id: athleteProfessors.id })
    .from(athleteProfessors)
    .where(
      and(
        eq(athleteProfessors.profileId, profileId),
        eq(athleteProfessors.academyId, academyId),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(athleteProfessors)
      .set({
        professorProfileId,
        status: "active",
      })
      .where(eq(athleteProfessors.id, existing.id));
  } else {
    await db.insert(athleteProfessors).values({
      profileId,
      professorProfileId,
      academyId,
      status: "active",
    });
  }

  return {};
}