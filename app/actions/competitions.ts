"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/db";
import { athleteProfessors, competitions, profiles } from "@/db/schema";
import { requireUser, getProfileForUser } from "@/lib/session";

const competitionSchema = z.object({
  name: z.string().trim().min(2),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  city: z.string().trim().max(120).optional().or(z.literal("")),
  countryCode: z.string().trim().max(2).optional().or(z.literal("")),
  federation: z.enum(["CBJJ", "IBJJF", "CBJJO", "STATE", "LOCAL", "OTHER"]),
  belt: z.string().trim().min(1),
  weightClass: z.string().trim().max(80).optional().or(z.literal("")),
  ageClass: z.enum([
    "ADULT",
    "MASTER1",
    "MASTER2",
    "MASTER3",
    "MASTER4",
    "MASTER5",
    "MASTER6",
    "MASTER7",
    "JUVENILE",
    "OTHER",
  ]),
  modality: z.enum(["GI", "NOGI"]),
  isAbsolute: z.boolean(),
  result: z.enum(["GOLD", "SILVER", "BRONZE", "PARTICIPATED"]),
  podiumPhotoUrl: z.string().trim().max(400_000).optional().or(z.literal("")),
  bracketUrl: z.string().trim().url().optional().or(z.literal("")),
});

export type CompetitionFormState = {
  error?: string;
  success?: string;
  id?: string;
};

async function ownedProfile() {
  const user = await requireUser();
  const profile = await getProfileForUser(user.id);
  if (!profile) throw new Error("missing profile");
  return { user, profile };
}

function parseForm(formData: FormData) {
  return competitionSchema.safeParse({
    name: formData.get("name"),
    eventDate: formData.get("eventDate"),
    city: formData.get("city") || "",
    countryCode: formData.get("countryCode") || "",
    federation: formData.get("federation") || "OTHER",
    belt: formData.get("belt"),
    weightClass: formData.get("weightClass") || "",
    ageClass: formData.get("ageClass") || "ADULT",
    modality: formData.get("modality") || "GI",
    isAbsolute: formData.get("isAbsolute") === "on",
    result: formData.get("result"),
    podiumPhotoUrl: formData.get("podiumPhotoUrl") || "",
    bracketUrl: formData.get("bracketUrl") || "",
  });
}

export async function createCompetitionAction(
  _prev: CompetitionFormState,
  formData: FormData,
): Promise<CompetitionFormState> {
  const { profile } = await ownedProfile();
  const parsed = parseForm(formData);
  if (!parsed.success || !parsed.data.name || !parsed.data.eventDate) {
    return { error: "Preencha o nome do campeonato e a data." };
  }

  const db = requireDb();
  const [row] = await db
    .insert(competitions)
    .values({
      profileId: profile.id,
      name: parsed.data.name,
      eventDate: parsed.data.eventDate,
      city: parsed.data.city || null,
      countryCode: parsed.data.countryCode || null,
      federation: parsed.data.federation,
      belt: parsed.data.belt,
      weightClass: parsed.data.weightClass || null,
      ageClass: parsed.data.ageClass,
      modality: parsed.data.modality,
      isAbsolute: parsed.data.isAbsolute,
      result: parsed.data.result,
      podiumPhotoUrl: parsed.data.podiumPhotoUrl?.startsWith("data:image/")
        ? parsed.data.podiumPhotoUrl
        : null,
      bracketUrl: parsed.data.bracketUrl || null,
      updatedAt: new Date(),
    })
    .returning({ id: competitions.id });

  revalidatePath("/painel");
  revalidatePath(`/atleta/${profile.slug}`);
  return { success: "ok", id: row.id };
}

export async function updateCompetitionAction(
  _prev: CompetitionFormState,
  formData: FormData,
): Promise<CompetitionFormState> {
  const { profile } = await ownedProfile();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Competição inválida." };

  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      error:
        parsed.error.issues[0]?.message ??
        "Preencha o nome do campeonato e a data.",
    };
  }

  const db = requireDb();
  const [owned] = await db
    .select({ id: competitions.id })
    .from(competitions)
    .where(
      and(eq(competitions.id, id), eq(competitions.profileId, profile.id)),
    )
    .limit(1);
  if (!owned) return { error: "Sem permissão." };

  await db
    .update(competitions)
    .set({
      name: parsed.data.name,
      eventDate: parsed.data.eventDate,
      city: parsed.data.city || null,
      countryCode: parsed.data.countryCode || null,
      federation: parsed.data.federation,
      belt: parsed.data.belt,
      weightClass: parsed.data.weightClass || null,
      ageClass: parsed.data.ageClass,
      modality: parsed.data.modality,
      isAbsolute: parsed.data.isAbsolute,
      result: parsed.data.result,
      podiumPhotoUrl: parsed.data.podiumPhotoUrl?.startsWith("data:image/")
        ? parsed.data.podiumPhotoUrl
        : parsed.data.podiumPhotoUrl || null,
      bracketUrl: parsed.data.bracketUrl || null,
      updatedAt: new Date(),
    })
    .where(eq(competitions.id, id));

  revalidatePath("/painel");
  revalidatePath(`/atleta/${profile.slug}`);
  return { success: "ok", id };
}

export async function deleteCompetitionAction(id: string) {
  const { profile } = await ownedProfile();
  const db = requireDb();
  await db
    .delete(competitions)
    .where(
      and(eq(competitions.id, id), eq(competitions.profileId, profile.id)),
    );
  revalidatePath("/painel");
  revalidatePath(`/atleta/${profile.slug}`);
}

export async function toggleCompetitionHiddenAction(id: string) {
  const { profile } = await ownedProfile();
  const db = requireDb();
  const [row] = await db
    .select({ hidden: competitions.hidden })
    .from(competitions)
    .where(
      and(eq(competitions.id, id), eq(competitions.profileId, profile.id)),
    )
    .limit(1);
  if (!row) return { error: "Sem permissão." as const };

  await db
    .update(competitions)
    .set({ hidden: !row.hidden, updatedAt: new Date() })
    .where(eq(competitions.id, id));

  revalidatePath("/painel");
  revalidatePath(`/atleta/${profile.slug}`);
  return { success: true as const, hidden: !row.hidden };
}

export async function verifyCompetitionAction(competitionId: string) {
  const user = await requireUser();
  const professor = await getProfileForUser(user.id);
  if (!professor || user.accountType !== "professor") {
    return { error: "Somente professores podem confirmar." as const };
  }

  const db = requireDb();
  const [comp] = await db
    .select({
      id: competitions.id,
      profileId: competitions.profileId,
      slug: profiles.slug,
    })
    .from(competitions)
    .innerJoin(profiles, eq(competitions.profileId, profiles.id))
    .where(eq(competitions.id, competitionId))
    .limit(1);

  if (!comp) return { error: "Competição não encontrada." as const };

  const [link] = await db
    .select({ id: athleteProfessors.id })
    .from(athleteProfessors)
    .where(
      and(
        eq(athleteProfessors.profileId, comp.profileId),
        eq(athleteProfessors.professorProfileId, professor.id),
        eq(athleteProfessors.status, "active"),
      ),
    )
    .limit(1);

  if (!link) {
    return { error: "Você não é professor deste aluno." as const };
  }

  await db
    .update(competitions)
    .set({
      verifiedByProfessorId: professor.id,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(competitions.id, competitionId));

  revalidatePath("/painel/professor");
  revalidatePath(`/atleta/${comp.slug}`);
  return { success: true as const };
}

export async function listCompetitionsForProfile(
  profileId: string,
  opts?: { includeHidden?: boolean },
) {
  const db = requireDb();
  const rows = await db
    .select()
    .from(competitions)
    .where(
      opts?.includeHidden
        ? eq(competitions.profileId, profileId)
        : and(
            eq(competitions.profileId, profileId),
            eq(competitions.hidden, false),
          ),
    )
    .orderBy(desc(competitions.eventDate));

  return rows.map((row) => ({
    ...row,
    eventDate: row.eventDate,
    verifiedAt: row.verifiedAt,
  }));
}
