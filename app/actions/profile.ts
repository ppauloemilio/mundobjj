"use server";

import { and, eq, ne } from "drizzle-orm";
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
  competitor: z.boolean(),
  bio: z.string().trim().max(500),
  weightKg: z.string().trim(),
  startedAt: z.string().trim(),
  whatsapp: z.string().trim(),
  contactEmail: z.string().trim(),
  showWhatsapp: z.boolean(),
  showEmail: z.boolean(),
  academyMode: z.enum(["list", "other"]),
  academyId: z.string().uuid().optional().or(z.literal("")),
  suggestedAcademyName: z.string().trim(),
  professorProfileId: z.string().uuid().optional().or(z.literal("")),
});

export type ProfileFormState = {
  error?: string;
  success?: string;
  savedAt?: string;
};

function normalizeWeight(value: string) {
  const cleaned = value.replace(",", ".").trim();
  if (!cleaned) return null;
  const num = Number(cleaned);
  if (!Number.isFinite(num) || num <= 0 || num > 999) return null;
  return num.toFixed(2);
}

function normalizeEmail(value: string) {
  const email = value.trim().toLowerCase();
  if (!email) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "invalid";
  return email;
}

export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  try {
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

    const contactEmail = normalizeEmail(parsed.data.contactEmail);
    if (contactEmail === "invalid") {
      return { error: "E-mail de contato inválido." };
    }

    const weightKg = parsed.data.weightKg
      ? normalizeWeight(parsed.data.weightKg)
      : null;
    if (parsed.data.weightKg && !weightKg) {
      return { error: "Peso inválido." };
    }

    const startedAt = parsed.data.startedAt || null;
    if (startedAt && !/^\d{4}-\d{2}-\d{2}$/.test(startedAt)) {
      return { error: "Data 'treina desde' inválida." };
    }

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

    const [profile] = await db
      .update(profiles)
      .set({
        name: parsed.data.name,
        slug,
        ...(resolvedCityId ? { cityId: resolvedCityId } : {}),
        belt: parsed.data.belt,
        stripes: parsed.data.stripes,
        style: parsed.data.style,
        competitor: parsed.data.competitor,
        bio: parsed.data.bio || null,
        weightKg,
        startedAt,
        whatsapp: parsed.data.whatsapp || null,
        contactEmail:
          contactEmail ||
          (user.email ? user.email.toLowerCase() : null),
        showWhatsapp: parsed.data.showWhatsapp,
        showEmail: parsed.data.showEmail,
        onboardingCompletedAt: new Date(),
      })
      .where(eq(profiles.userId, user.id))
      .returning();

    if (!profile) return { error: "Perfil não encontrado." };

    if (parsed.data.academyMode === "other" && parsed.data.suggestedAcademyName) {
      await db.insert(academySuggestions).values({
        name: parsed.data.suggestedAcademyName,
        suggestedByUserId: user.id,
        contact: contactEmail || user.email || null,
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
    revalidatePath("/");
    revalidatePath(`/atleta/${slug}`);
    return {
      success: "Perfil atualizado.",
      savedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("updateProfileAction", error);
    return { error: "Não foi possível salvar o perfil. Tente de novo." };
  }
}

export async function completeOnboardingAction() {
  const user = await requireUser();
  const db = requireDb();
  await db
    .update(profiles)
    .set({ onboardingCompletedAt: new Date() })
    .where(eq(profiles.userId, user.id));
  revalidatePath("/painel");
  revalidatePath("/");
}

export async function isSlugAvailable(slugRaw: string, userId?: string) {
  const slug = slugify(slugRaw);
  if (!slug || slug.length < 2) {
    return { available: false, slug, reason: "invalid" as const };
  }
  const db = requireDb();
  const query = userId
    ? and(eq(profiles.slug, slug), ne(profiles.userId, userId))
    : eq(profiles.slug, slug);
  const [taken] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(query)
    .limit(1);
  return { available: !taken, slug, reason: taken ? ("taken" as const) : null };
}
