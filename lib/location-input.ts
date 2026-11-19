import { requireDb } from "@/db";
import { locationSuggestions } from "@/db/schema";

export type LocationInput = {
  cityId: string | null;
  customCountry?: string;
  customState?: string;
  customCity?: string;
  countryIso2?: string;
  stateId?: string;
};

export function readLocationFromForm(formData: FormData): LocationInput {
  const countryMode = String(formData.get("countryMode") || "");
  const stateMode = String(formData.get("stateMode") || "");
  const cityMode = String(formData.get("cityMode") || "");

  return {
    cityId:
      cityMode === "other" ? null : String(formData.get("cityId") || "") || null,
    countryIso2:
      countryMode === "other"
        ? undefined
        : String(formData.get("countryIso2") || "") || undefined,
    stateId:
      stateMode === "other"
        ? undefined
        : String(formData.get("stateId") || "") || undefined,
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
  userId?: string,
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
      stateId: input.stateId ?? null,
      stateName: input.customState ?? null,
      suggestedByUserId: userId ?? null,
    });
  }

  if (rows.length) {
    await db.insert(locationSuggestions).values(rows);
  }

  return input.cityId;
}
