"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireDb } from "@/db";
import {
  academySuggestions,
  cities,
  countries,
  locationSuggestions,
  states,
} from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { slugify } from "@/lib/slug";

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

export async function approveAcademySuggestionAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") || "");
  if (!id) return;
  const db = requireDb();
  await db
    .update(academySuggestions)
    .set({ status: "approved" })
    .where(eq(academySuggestions.id, id));
  revalidatePath("/admin/sugestoes");
  revalidatePath("/admin");
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
  revalidatePath("/admin");
}
