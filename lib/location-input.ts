import { and, eq } from "drizzle-orm";
import { requireDb } from "@/db";
import { cities, countries, locationSuggestions, states } from "@/db/schema";
import {
  getWorldCountryName,
  getWorldStateName,
} from "@/lib/world-geo";

export type LocationInput = {
  cityId: string | null;
  countryIso2?: string;
  stateCode?: string;
  cityName?: string;
  customCountry?: string;
  customState?: string;
  customCity?: string;
  countryMode?: string;
  stateMode?: string;
  cityMode?: string;
};

export function readLocationFromForm(formData: FormData): LocationInput {
  const countryMode = String(formData.get("countryMode") || "list");
  const stateMode = String(formData.get("stateMode") || "list");
  const cityMode = String(formData.get("cityMode") || "list");

  return {
    cityId: String(formData.get("cityId") || "") || null,
    countryMode,
    stateMode,
    cityMode,
    countryIso2:
      countryMode === "other"
        ? undefined
        : String(formData.get("countryIso2") || "").toUpperCase() || undefined,
    stateCode:
      stateMode === "other"
        ? undefined
        : String(formData.get("stateCode") || "").toUpperCase() || undefined,
    cityName:
      cityMode === "other"
        ? undefined
        : String(formData.get("cityName") || "").trim() || undefined,
    customCountry:
      countryMode === "other"
        ? String(formData.get("customCountry") || "").trim() || undefined
        : undefined,
    customState:
      stateMode === "other"
        ? String(formData.get("customState") || "").trim() || undefined
        : undefined,
    customCity:
      cityMode === "other"
        ? String(formData.get("customCity") || "").trim() || undefined
        : undefined,
  };
}

export async function saveLocationSuggestions(
  input: LocationInput,
  userId?: string | null,
) {
  const db = requireDb();
  const rows = [];

  if (input.customCountry) {
    rows.push({
      kind: "country" as const,
      name: input.customCountry,
      countryName: input.customCountry,
      suggestedByUserId: userId ?? null,
    });
  }

  if (input.customState) {
    rows.push({
      kind: "state" as const,
      name: input.customState,
      countryIso2: input.countryIso2 ?? null,
      countryName: input.customCountry ?? null,
      stateName: input.customState,
      suggestedByUserId: userId ?? null,
    });
  }

  if (input.customCity) {
    rows.push({
      kind: "city" as const,
      name: input.customCity,
      countryIso2: input.countryIso2 ?? null,
      countryName: input.customCountry ?? null,
      stateName: input.customState ?? null,
      suggestedByUserId: userId ?? null,
    });
  }

  if (rows.length) {
    await db.insert(locationSuggestions).values(rows);
  }
}

/** Garante país/estado/cidade no banco a partir da seleção mundial e devolve cityId. */
export async function resolveLocationToCityId(
  input: LocationInput,
  userId?: string | null,
): Promise<string | null> {
  await saveLocationSuggestions(input, userId);

  if (input.customCity || input.cityMode === "other") {
    return null;
  }

  if (input.cityId && !input.countryIso2) {
    return input.cityId;
  }

  const countryIso2 = input.countryIso2?.toUpperCase();
  const stateCode = input.stateCode?.toUpperCase();
  const cityName = input.cityName?.trim();
  if (!countryIso2 || !stateCode || !cityName) return null;

  const db = requireDb();
  const countryName = getWorldCountryName(countryIso2);
  const stateName = getWorldStateName(countryIso2, stateCode);

  let [country] = await db
    .select()
    .from(countries)
    .where(eq(countries.iso2, countryIso2))
    .limit(1);

  if (!country) {
    [country] = await db
      .insert(countries)
      .values({ name: countryName, iso2: countryIso2 })
      .onConflictDoNothing({ target: countries.iso2 })
      .returning();
    if (!country) {
      [country] = await db
        .select()
        .from(countries)
        .where(eq(countries.iso2, countryIso2))
        .limit(1);
    }
  }

  if (!country) return null;

  let [state] = await db
    .select()
    .from(states)
    .where(and(eq(states.countryId, country.id), eq(states.code, stateCode)))
    .limit(1);

  if (!state) {
    [state] = await db
      .insert(states)
      .values({ countryId: country.id, name: stateName, code: stateCode })
      .onConflictDoNothing({ target: [states.countryId, states.code] })
      .returning();
    if (!state) {
      [state] = await db
        .select()
        .from(states)
        .where(and(eq(states.countryId, country.id), eq(states.code, stateCode)))
        .limit(1);
    }
  }

  if (!state) return null;

  let [city] = await db
    .select()
    .from(cities)
    .where(and(eq(cities.stateId, state.id), eq(cities.name, cityName)))
    .limit(1);

  if (!city) {
    [city] = await db
      .insert(cities)
      .values({ stateId: state.id, name: cityName })
      .onConflictDoNothing({ target: [cities.stateId, cities.name] })
      .returning();
    if (!city) {
      [city] = await db
        .select()
        .from(cities)
        .where(and(eq(cities.stateId, state.id), eq(cities.name, cityName)))
        .limit(1);
    }
  }

  return city?.id ?? null;
}

export async function getCitySelection(cityId: string | null | undefined) {
  if (!cityId) return null;
  const db = requireDb();
  const [row] = await db
    .select({
      cityId: cities.id,
      cityName: cities.name,
      stateCode: states.code,
      stateName: states.name,
      countryIso2: countries.iso2,
      countryName: countries.name,
    })
    .from(cities)
    .innerJoin(states, eq(cities.stateId, states.id))
    .innerJoin(countries, eq(states.countryId, countries.id))
    .where(eq(cities.id, cityId))
    .limit(1);
  return row ?? null;
}

export type AddressInput = {
  postalCode?: string;
  street?: string;
  streetNumber?: string;
  complement?: string;
  neighborhood?: string;
};

export function readAddressFromForm(formData: FormData): AddressInput {
  return {
    postalCode: String(formData.get("postalCode") || "").replace(/\D/g, "") || undefined,
    street: String(formData.get("street") || "").trim() || undefined,
    streetNumber: String(formData.get("streetNumber") || "").trim() || undefined,
    complement: String(formData.get("complement") || "").trim() || undefined,
    neighborhood: String(formData.get("neighborhood") || "").trim() || undefined,
  };
}

export function composeStreetAddress(input: AddressInput) {
  const line = [input.street, input.streetNumber].filter(Boolean).join(", ");
  if (input.complement) {
    return line ? `${line} — ${input.complement}` : input.complement;
  }
  return line || null;
}