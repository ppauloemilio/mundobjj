import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { businessCategories, cities, countries, states } from "@/db/schema";

export async function databaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export async function listCountries() {
  const db = getDb();
  if (!db) return [];
  return db
    .select({ id: countries.id, name: countries.name, iso2: countries.iso2 })
    .from(countries)
    .orderBy(asc(countries.name));
}

export async function listStates(iso2: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({ id: states.id, name: states.name, code: states.code })
    .from(states)
    .innerJoin(countries, eq(states.countryId, countries.id))
    .where(eq(countries.iso2, iso2.toUpperCase()))
    .orderBy(asc(states.name));
}

export async function listCities(stateId: string) {
  const db = getDb();
  if (!db) return [];
  return db
    .select({ id: cities.id, name: cities.name })
    .from(cities)
    .where(eq(cities.stateId, stateId))
    .orderBy(asc(cities.name));
}

export async function listCategories() {
  const db = getDb();
  if (!db) return [];
  return db
    .select({
      id: businessCategories.id,
      name: businessCategories.name,
      slug: businessCategories.slug,
    })
    .from(businessCategories)
    .where(eq(businessCategories.active, true))
    .orderBy(asc(businessCategories.sortOrder), asc(businessCategories.name));
}
