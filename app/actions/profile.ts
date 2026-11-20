"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/db";
import {
  academies,
  academySuggestions,
  memberships,
  profiles,
} from "@/db/schema";
import { saveAthleteProfessorLink } from "@/lib/athlete-professor";
import {
  readLocationFromForm,
  resolveLocationToCityId,
} from "@/lib/location-input";
import { requireUser } from "@/lib/session";
import { slugify } from "@/lib/slug";

const profileSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  belt: z.enum([
    "white",
    "blue",
    "purple",
    "brown",
    "black",
    "gray",
    "yellow",
    "orange",
    "green",
  ]),
  stripes: z.coerce.number().int().min(0).max(4),
  style: z.enum(["gi", "nogi", "both"]),
  competitor: z.coerce.boolean().optional(),
  bio: z.string().trim().max(500).optional(),
  weightKg: z.string().optional(),
  startedAt: z.string().optional(),
  whatsapp: z.string().trim().optional(),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  showWhatsapp: z.coerce.boolean().optional(),
  showEmail: z.coerce.boolean().optional(),
  academyMode: z.enum(["list", "other"]).optional(),
  academyId: z.string().uuid().optional().or(z.literal("")),
  suggestedAcademyName: z.string().trim().optional(),
  professorProfileId: z.string().uuid().optional().or(z.literal("")),
});

export type ProfileFormState = {
  error?: string;
  success?: string;
};

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireUser();
  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    belt: formData.get("belt"),
    stripes: formData.get("stripes"),
    style: formData.get("style"),
    competitor: formData.get("competitor") === "on",
    bio: formData.get("bio") || "",
    weightKg: formData.get("weightKg") || "",
    startedAt: formData.get("startedAt") || "",
    whatsapp: formData.get("whatsapp") || "",
    contactEmail: formData.get("contactEmail") || "",
    showWhatsapp: formData.get("showWhatsapp") === "on",
    showEmail: formData.get("showEmail") === "on",
    academyMode: formData.get("academyMode") || "list",
    academyId: formData.get("academyId") || "",
    suggestedAcademyName: formData.get("suggestedAcademyName") || "",
    professorProfileId: formData.get("professorProfileId") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const slug = slugify(parsed.data.slug);
  if (!slug) return { error: "Slug inválido." };

  const db = requireDb();
  const [taken] = await db
    .select({ id: profiles.id, userId: profiles.userId })
    .from(profiles)
    .where(eq(profiles.slug, slug))
    .limit(1);

  if (taken && taken.userId !== user.id) {
    return { error: "Este link de perfil já está em uso." };
  }

  const location = readLocationFromForm(formData);
  const resolvedCityId = await resolveLocationToCityId(location, user.id);
  const nextCityId = location.customCity
    ? undefined
    : resolvedCityId || undefined;

  const [profile] = await db
    .update(profiles)
    .set({
      name: parsed.data.name,
      slug,
      ...(nextCityId !== undefined ? { cityId: nextCityId } : {}),
      belt: parsed.data.belt,
      stripes: parsed.data.stripes,
      style: parsed.data.style,
      competitor: Boolean(parsed.data.competitor),
      bio: parsed.data.bio || null,
      weightKg: parsed.data.weightKg || null,
      startedAt: parsed.data.startedAt || null,
      whatsapp: parsed.data.whatsapp || null,
      contactEmail: parsed.data.contactEmail || null,
      showWhatsapp: Boolean(parsed.data.showWhatsapp),
      showEmail: Boolean(parsed.data.showEmail),
    })
    .where(eq(profiles.userId, user.id))
    .returning();

  if (!profile) return { error: "Perfil não encontrado." };

  if (parsed.data.academyMode === "other" && parsed.data.suggestedAcademyName) {
    await db.insert(academySuggestions).values({
      name: parsed.data.suggestedAcademyName,
      suggestedByUserId: user.id,
      contact: parsed.data.contactEmail || user.email || null,
    });
  } else if (parsed.data.academyId) {
    const [academy] = await db
      .select({ id: academies.id })
      .from(academies)
      .where(eq(academies.id, parsed.data.academyId))
      .limit(1);

    if (academy) {
      await db
        .update(memberships)
        .set({
          status: "left",
          endedAt: new Date().toISOString().slice(0, 10),
        })
        .where(
          and(
            eq(memberships.profileId, profile.id),
            eq(memberships.status, "active"),
          ),
        );

      await db.insert(memberships).values({
        profileId: profile.id,
        academyId: academy.id,
        status: "active",
        startedAt: new Date().toISOString().slice(0, 10),
      });

      if (parsed.data.professorProfileId) {
        const linked = await saveAthleteProfessorLink(db, {
          profileId: profile.id,
          academyId: academy.id,
          professorProfileId: parsed.data.professorProfileId,
        });
        if (linked.error) return { error: linked.error };
      }
    }
  }

  revalidatePath("/painel");
  revalidatePath(`/atleta/${slug}`);
  return { success: "Perfil atualizado." };
}
