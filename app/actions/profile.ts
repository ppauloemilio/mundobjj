"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/db";
import { profiles } from "@/db/schema";
import { requireUser } from "@/lib/session";
import { slugify } from "@/lib/slug";

const profileSchema = z.object({
  name: z.string().trim().min(2),
  slug: z.string().trim().min(2),
  cityId: z.string().uuid().optional().or(z.literal("")),
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
    cityId: formData.get("cityId") || "",
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

  await db
    .update(profiles)
    .set({
      name: parsed.data.name,
      slug,
      cityId: parsed.data.cityId || null,
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
    .where(eq(profiles.userId, user.id));

  revalidatePath("/painel");
  revalidatePath(`/atleta/${slug}`);
  return { success: "Perfil atualizado." };
}
