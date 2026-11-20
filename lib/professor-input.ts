import { and, eq } from "drizzle-orm";
import type { requireDb } from "@/db";
import {
  academyProfessors,
  professorSuggestions,
  profiles,
  users,
} from "@/db/schema";

type Db = ReturnType<typeof requireDb>;

export function readProfessorFromForm(formData: FormData) {
  const professorMode = String(formData.get("professorMode") || "list");
  const professorProfileId = String(formData.get("professorProfileId") || "");
  const suggestedProfessorName = String(
    formData.get("suggestedProfessorName") || "",
  ).trim();

  return { professorMode, professorProfileId, suggestedProfessorName };
}

export async function resolveResponsibleProfessor(
  db: Db,
  input: {
    professorMode: string;
    professorProfileId: string;
    suggestedProfessorName: string;
    academyId?: string | null;
    academyName?: string | null;
    userId?: string | null;
    contact?: string | null;
  },
): Promise<{ professorName: string | null; professorProfileId: string | null }> {
  if (input.professorMode === "other") {
    if (input.suggestedProfessorName.length < 2) {
      return { professorName: null, professorProfileId: null };
    }

    await db.insert(professorSuggestions).values({
      name: input.suggestedProfessorName,
      academyId: input.academyId || null,
      academyName: input.academyName || null,
      contact: input.contact || null,
      suggestedByUserId: input.userId || null,
      status: "pending",
    });

    return {
      professorName: input.suggestedProfessorName,
      professorProfileId: null,
    };
  }

  if (!input.professorProfileId) {
    return { professorName: null, professorProfileId: null };
  }

  const [professor] = await db
    .select({
      id: profiles.id,
      name: profiles.name,
      accountType: users.accountType,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(
      and(
        eq(profiles.id, input.professorProfileId),
        eq(users.accountType, "professor"),
      ),
    )
    .limit(1);

  if (!professor) {
    return { professorName: null, professorProfileId: null };
  }

  if (input.academyId) {
    const [existing] = await db
      .select({ id: academyProfessors.id, status: academyProfessors.status })
      .from(academyProfessors)
      .where(
        and(
          eq(academyProfessors.academyId, input.academyId),
          eq(academyProfessors.professorProfileId, professor.id),
        ),
      )
      .limit(1);

    if (!existing) {
      await db.insert(academyProfessors).values({
        academyId: input.academyId,
        professorProfileId: professor.id,
        status: "active",
      });
    } else if (existing.status !== "active") {
      await db
        .update(academyProfessors)
        .set({ status: "active" })
        .where(eq(academyProfessors.id, existing.id));
    }
  }

  return {
    professorName: professor.name,
    professorProfileId: professor.id,
  };
}