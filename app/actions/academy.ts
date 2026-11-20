"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireDb } from "@/db";
import { academies, classSchedules, cities, profiles, states } from "@/db/schema";
import { geocodeAddress } from "@/lib/geocode";
import {
  readLocationFromForm,
  saveLocationSuggestions,
} from "@/lib/location-input";
import {
  readProfessorFromForm,
  resolveResponsibleProfessor,
} from "@/lib/professor-input";
import { requireUser } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";

const academySchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2),
  affiliation: z.string().trim().optional(),
  whatsapp: z.string().trim().optional(),
  address: z.string().trim().min(5),
  neighborhood: z.string().trim().optional(),
  acceptsVisitor: z.coerce.boolean().optional(),
  dropInPrice: z.string().optional(),
  visitorNotes: z.string().trim().optional(),
});

export type AcademyFormState = {
  error?: string;
  success?: string;
};

export async function saveAcademyAction(
  _prev: AcademyFormState,
  formData: FormData,
): Promise<AcademyFormState> {
  const user = await requireUser();
  const parsed = academySchema.safeParse({
    id: formData.get("id") || "",
    name: formData.get("name"),
    affiliation: formData.get("affiliation") || "",
    whatsapp: formData.get("whatsapp") || "",
    address: formData.get("address"),
    neighborhood: formData.get("neighborhood") || "",
    acceptsVisitor: formData.get("acceptsVisitor") === "on",
    dropInPrice: formData.get("dropInPrice") || "",
    visitorNotes: formData.get("visitorNotes") || "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const professorInput = readProfessorFromForm(formData);
  if (
    professorInput.professorMode === "other" &&
    professorInput.suggestedProfessorName.length < 2
  ) {
    return { error: "Informe o nome do professor ou escolha na lista." };
  }

  const db = requireDb();
  const location = readLocationFromForm(formData);
  await saveLocationSuggestions(location, user.id);
  const cityId = location.customCity ? null : location.cityId;

  if (!cityId && !location.customCity && !parsed.data.id) {
    return { error: "Selecione a cidade ou use Outro." };
  }

  let placeName = "";
  if (cityId) {
    const [place] = await db
      .select({
        city: cities.name,
        state: states.name,
        stateCode: states.code,
      })
      .from(cities)
      .innerJoin(states, eq(cities.stateId, states.id))
      .where(eq(cities.id, cityId))
      .limit(1);
    if (place) {
      placeName = [place.city, place.stateCode, place.state]
        .filter(Boolean)
        .join(", ");
    }
  }

  const query = [
    parsed.data.address,
    parsed.data.neighborhood,
    placeName,
    location.customCity,
    location.customState,
    location.customCountry,
  ]
    .filter(Boolean)
    .join(", ");

  const coords = await geocodeAddress(query);

  let academyId = parsed.data.id || "";
  let slug = "";

  if (academyId) {
    const [owned] = await db
      .select()
      .from(academies)
      .where(and(eq(academies.id, academyId), eq(academies.ownerId, user.id)))
      .limit(1);
    if (!owned) return { error: "Academia não encontrada." };
    slug = owned.slug;
  }

  const provisionalName =
    professorInput.professorMode === "other"
      ? professorInput.suggestedProfessorName || null
      : null;

  const values = {
    name: parsed.data.name,
    affiliation: parsed.data.affiliation || null,
    professorName: provisionalName,
    whatsapp: parsed.data.whatsapp || null,
    address: parsed.data.address,
    neighborhood: parsed.data.neighborhood || null,
    ...(cityId ? { cityId } : {}),
    lat: coords ? String(coords.lat) : null,
    lng: coords ? String(coords.lng) : null,
    acceptsVisitor: Boolean(parsed.data.acceptsVisitor),
    dropInPrice: parsed.data.dropInPrice || null,
    visitorNotes: parsed.data.visitorNotes || null,
    ownerId: user.id,
  };

  if (academyId) {
    await db.update(academies).set(values).where(eq(academies.id, academyId));
  } else {
    slug = uniqueSlug(parsed.data.name);
    const [created] = await db
      .insert(academies)
      .values({ ...values, slug })
      .returning({ id: academies.id, slug: academies.slug });
    academyId = created.id;
    slug = created.slug;
  }

  const professor = await resolveResponsibleProfessor(db, {
    ...professorInput,
    academyId,
    academyName: parsed.data.name,
    userId: user.id,
    contact: parsed.data.whatsapp || user.email || null,
  });

  if (professor.professorName !== provisionalName) {
    await db
      .update(academies)
      .set({ professorName: professor.professorName })
      .where(eq(academies.id, academyId));
  }

  await db.delete(classSchedules).where(eq(classSchedules.academyId, academyId));

  const weekdays = formData.getAll("scheduleWeekday");
  const starts = formData.getAll("scheduleStartsAt");
  const ends = formData.getAll("scheduleEndsAt");
  const kinds = formData.getAll("scheduleKind");
  const levels = formData.getAll("scheduleLevel");
  const professorIds = formData.getAll("scheduleProfessorProfileId");

  const nameByProfileId = new Map<string, string>();
  const parsedProfessorIds = professorIds
    .map((value) => String(value || "").trim())
    .filter((id) => id.length > 0);
  if (parsedProfessorIds.length) {
    const uniqueIds = [...new Set(parsedProfessorIds)];
    const professorRows = await db
      .select({ id: profiles.id, name: profiles.name })
      .from(profiles)
      .where(inArray(profiles.id, uniqueIds));
    for (const row of professorRows) {
      nameByProfileId.set(row.id, row.name);
    }
  }

  const rows = weekdays
    .map((weekday, index) => {
      const startsAt = String(starts[index] || "");
      const endsAt = String(ends[index] || "");
      const kind = String(kinds[index] || "");
      if (!startsAt || !endsAt || !kind) return null;
      const professorProfileId =
        String(professorIds[index] || "").trim() || null;
      const professorName = professorProfileId
        ? nameByProfileId.get(professorProfileId) ?? null
        : null;
      return {
        academyId,
        weekday: Number(weekday),
        startsAt,
        endsAt,
        kind: kind as
          | "fundamentals"
          | "gi"
          | "nogi"
          | "competition"
          | "kids"
          | "open_mat",
        level: String(levels[index] || "") || null,
        professorProfileId,
        professorName,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (rows.length) {
    await db.insert(classSchedules).values(rows);
  }

  revalidatePath("/");
  revalidatePath("/painel/academia");
  revalidatePath(`/academia/${slug}`);
  redirect(`/painel/academia?saved=${slugify(slug)}`);
}
