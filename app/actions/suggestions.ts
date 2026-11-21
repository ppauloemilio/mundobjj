"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireDb } from "@/db";
import {
  academies,
  academySuggestions,
  cities,
  countries,
  locationSuggestions,
  professorSuggestions,
  states,
} from "@/db/schema";
import { geocodeAddress } from "@/lib/geocode";
import {
  composeStreetAddress,
  readAddressFromForm,
  readLocationFromForm,
  resolveLocationToCityId,
} from "@/lib/location-input";
import { requireAdmin } from "@/lib/session";
import { slugify, uniqueSlug } from "@/lib/slug";
import { getWorldCountryName, getWorldStateName } from "@/lib/world-geo";

export type SuggestionFormState = {
  error?: string;
  success?: string;
  academySlug?: string;
};

export async function approveLocationSuggestionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const db = requireDb();
  const [row] = await db
    .select()
    .from(locationSuggestions)
    .where(eq(locationSuggestions.id, id))
    .limit(1);

  if (!row || row.status !== "pending") return;

  if (row.kind === "country") {
    const iso2 = (slugify(row.name).slice(0, 2) || "xx").toUpperCase();
    await db
      .insert(countries)
      .values({ name: row.name, iso2 })
      .onConflictDoNothing({ target: countries.iso2 });
  }

  if (row.kind === "state") {
    let countryId = null as string | null;
    if (row.countryIso2) {
      const [country] = await db
        .select()
        .from(countries)
        .where(eq(countries.iso2, row.countryIso2))
        .limit(1);
      countryId = country?.id ?? null;
    }
    if (!countryId && row.countryName) {
      const [country] = await db
        .insert(countries)
        .values({
          name: row.countryName,
          iso2: (slugify(row.countryName).slice(0, 2) || "xx").toUpperCase(),
        })
        .onConflictDoNothing({ target: countries.iso2 })
        .returning();
      if (country) countryId = country.id;
      else {
        const [existing] = await db
          .select()
          .from(countries)
          .where(eq(countries.name, row.countryName))
          .limit(1);
        countryId = existing?.id ?? null;
      }
    }
    if (countryId) {
      const code = (slugify(row.name).slice(0, 3) || "xx").toUpperCase();
      await db
        .insert(states)
        .values({ countryId, name: row.name, code })
        .onConflictDoNothing({ target: [states.countryId, states.code] });
    }
  }

  if (row.kind === "city") {
    let stateId = row.stateId;
    if (!stateId && row.stateName && row.countryIso2) {
      const [country] = await db
        .select()
        .from(countries)
        .where(eq(countries.iso2, row.countryIso2))
        .limit(1);
      if (country) {
        const [state] = await db
          .select()
          .from(states)
          .where(eq(states.countryId, country.id))
          .limit(1);
        stateId = state?.id ?? null;
        if (!stateId) {
          const [created] = await db
            .insert(states)
            .values({
              countryId: country.id,
              name: row.stateName,
              code: (slugify(row.stateName).slice(0, 3) || "xx").toUpperCase(),
            })
            .returning();
          stateId = created.id;
        }
      }
    }
    if (stateId) {
      await db
        .insert(cities)
        .values({ stateId, name: row.name })
        .onConflictDoNothing({ target: [cities.stateId, cities.name] });
    }
  }

  await db
    .update(locationSuggestions)
    .set({ status: "approved" })
    .where(eq(locationSuggestions.id, id));

  revalidatePath("/admin/sugestoes");
  revalidatePath("/admin");
}

export async function rejectLocationSuggestionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const db = requireDb();
  await db
    .update(locationSuggestions)
    .set({ status: "rejected" })
    .where(eq(locationSuggestions.id, id));
  revalidatePath("/admin/sugestoes");
  revalidatePath("/admin");
}

/** Accept suggestion → create registered academy (ownerless). */
export async function approveAcademySuggestionAction(
  _prev: SuggestionFormState,
  formData: FormData,
): Promise<SuggestionFormState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return { error: "Sugestão inválida." };

  const parsed = z
    .object({
      name: z.string().trim().min(2, "Informe o nome da academia."),
      whatsapp: z.string().trim().optional(),
      acceptsVisitor: z.coerce.boolean().optional(),
    })
    .safeParse({
      name: formData.get("name"),
      whatsapp: formData.get("whatsapp") || "",
      acceptsVisitor: formData.get("acceptsVisitor") === "on",
    });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const db = requireDb();
  const [row] = await db
    .select()
    .from(academySuggestions)
    .where(eq(academySuggestions.id, id))
    .limit(1);

  if (!row || row.status !== "pending") {
    return { error: "Sugestão já tratada ou não encontrada." };
  }

  const address = readAddressFromForm(formData);
  const location = readLocationFromForm(formData);
  const hasStreet = Boolean(address.street && address.streetNumber);
  const cityId = await resolveLocationToCityId(location, admin.id);

  let composedAddress: string | null = null;
  let lat: string | null = null;
  let lng: string | null = null;

  if (hasStreet) {
    composedAddress = composeStreetAddress(address);
    const placeName = [
      location.cityName || location.customCity || row.cityText,
      location.stateCode
        ? getWorldStateName(location.countryIso2 || "BR", location.stateCode)
        : location.customState,
      location.countryIso2
        ? getWorldCountryName(location.countryIso2)
        : location.customCountry,
    ]
      .filter(Boolean)
      .join(", ");
    const coords = await geocodeAddress(
      [composedAddress, address.neighborhood, placeName]
        .filter(Boolean)
        .join(", "),
    );
    lat = coords ? String(coords.lat) : null;
    lng = coords ? String(coords.lng) : null;
  } else if (row.cityText) {
    composedAddress = row.cityText;
  }

  const [created] = await db
    .insert(academies)
    .values({
      slug: uniqueSlug(parsed.data.name),
      name: parsed.data.name,
      whatsapp: parsed.data.whatsapp || row.contact || null,
      address: composedAddress,
      postalCode: address.postalCode || null,
      street: address.street || null,
      streetNumber: address.streetNumber || null,
      complement: address.complement || null,
      neighborhood: address.neighborhood || null,
      ...(cityId ? { cityId } : {}),
      lat,
      lng,
      acceptsVisitor: Boolean(parsed.data.acceptsVisitor),
      ownerId: null,
    })
    .returning({ id: academies.id, slug: academies.slug });

  await db
    .update(academySuggestions)
    .set({ status: "approved", academyId: created.id })
    .where(eq(academySuggestions.id, id));

  revalidatePath("/admin/sugestoes");
  revalidatePath("/admin/academias");
  revalidatePath("/admin");
  revalidatePath("/");
  return {
    success: `Academia cadastrada (${created.slug}). Sem dono — o responsável pode pedir acesso na ficha pública.`,
    academySlug: created.slug,
  };
}

export async function rejectAcademySuggestionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const db = requireDb();
  await db
    .update(academySuggestions)
    .set({ status: "rejected" })
    .where(eq(academySuggestions.id, id));
  revalidatePath("/admin/sugestoes");
  revalidatePath("/admin/academias");
  revalidatePath("/admin");
}

export async function approveProfessorSuggestionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;

  const db = requireDb();
  const [row] = await db
    .select()
    .from(professorSuggestions)
    .where(eq(professorSuggestions.id, id))
    .limit(1);

  if (!row || row.status !== "pending") return;

  if (row.academyId) {
    await db
      .update(academies)
      .set({ professorName: row.name })
      .where(eq(academies.id, row.academyId));
  }

  await db
    .update(professorSuggestions)
    .set({ status: "approved" })
    .where(eq(professorSuggestions.id, id));

  revalidatePath("/admin/sugestoes");
  revalidatePath("/admin");
  revalidatePath("/admin/academias");
}

export async function rejectProfessorSuggestionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const db = requireDb();
  await db
    .update(professorSuggestions)
    .set({ status: "rejected" })
    .where(eq(professorSuggestions.id, id));
  revalidatePath("/admin/sugestoes");
  revalidatePath("/admin");
}
