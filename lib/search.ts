import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import {
  academies,
  businessCategories,
  businesses,
  cities,
  classSchedules,
  states,
} from "@/db/schema";
import { nextClassLabel } from "@/lib/labels";

export type AcademyResult = {
  id: string;
  name: string;
  slug: string;
  professorName: string | null;
  whatsapp: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  acceptsVisitor: boolean;
  dropInPrice: string | null;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  nextClass: string | null;
};

export type StoreResult = {
  id: string;
  name: string;
  slug: string;
  category: string;
  address: string | null;
  city: string | null;
  whatsapp: string | null;
  link: string | null;
  lat: number | null;
  lng: number | null;
  distanceKm: number | null;
  sponsored: true;
};

type PlaceFilter = {
  cityId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
};

function toNumber(value: string | null) {
  if (value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function distanceSql(lat: number, lng: number, latColumn: unknown, lngColumn: unknown) {
  return sql<number>`(
    6371 * acos(
      least(1::float8, greatest(-1::float8,
        cos(radians(${lat})) * cos(radians(${latColumn}::float8)) *
        cos(radians(${lngColumn}::float8) - radians(${lng})) +
        sin(radians(${lat})) * sin(radians(${latColumn}::float8))
      ))
    )
  )`;
}

function box(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.max(0.2, Math.cos((lat * Math.PI) / 180)));
  return { latDelta, lngDelta };
}

export async function searchAcademies(filter: PlaceFilter): Promise<AcademyResult[]> {
  const db = getDb();
  if (!db) return [];

  const distance =
    filter.lat != null && filter.lng != null
      ? distanceSql(filter.lat, filter.lng, academies.lat, academies.lng)
      : sql<number | null>`null`;

  const conditions = [];
  if (filter.cityId) conditions.push(eq(academies.cityId, filter.cityId));
  if (filter.lat != null && filter.lng != null) {
    const radius = filter.radiusKm ?? 10;
    const { latDelta, lngDelta } = box(filter.lat, filter.lng, radius);
    conditions.push(sql`${academies.lat} is not null`);
    conditions.push(
      sql`${academies.lat}::float8 between ${filter.lat - latDelta} and ${filter.lat + latDelta}`,
    );
    conditions.push(
      sql`${academies.lng}::float8 between ${filter.lng - lngDelta} and ${filter.lng + lngDelta}`,
    );
  }

  const rows = await db
    .select({
      id: academies.id,
      name: academies.name,
      slug: academies.slug,
      professorName: academies.professorName,
      whatsapp: academies.whatsapp,
      address: academies.address,
      neighborhood: academies.neighborhood,
      city: cities.name,
      state: states.code,
      acceptsVisitor: academies.acceptsVisitor,
      dropInPrice: academies.dropInPrice,
      lat: academies.lat,
      lng: academies.lng,
      distanceKm: distance,
    })
    .from(academies)
    .leftJoin(cities, eq(academies.cityId, cities.id))
    .leftJoin(states, eq(cities.stateId, states.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(filter.lat != null ? distance : asc(academies.name))
    .limit(50);

  const ids = rows.map((row) => row.id);
  const schedules = ids.length
    ? await db
        .select({
          academyId: classSchedules.academyId,
          weekday: classSchedules.weekday,
          startsAt: classSchedules.startsAt,
          kind: classSchedules.kind,
        })
        .from(classSchedules)
        .where(inArray(classSchedules.academyId, ids))
    : [];

  return rows.map((row) => ({
    ...row,
    lat: toNumber(row.lat),
    lng: toNumber(row.lng),
    distanceKm: row.distanceKm == null ? null : Number(row.distanceKm),
    nextClass: nextClassLabel(
      schedules.filter((schedule) => schedule.academyId === row.id),
    ),
  }));
}

export async function searchStores(
  filter: PlaceFilter & { categorySlug?: string },
): Promise<StoreResult[]> {
  const db = getDb();
  if (!db) return [];

  const distance =
    filter.lat != null && filter.lng != null
      ? distanceSql(filter.lat, filter.lng, businesses.lat, businesses.lng)
      : sql<number | null>`null`;

  const conditions = [eq(businesses.sponsored, true)];
  if (filter.cityId) conditions.push(eq(businesses.cityId, filter.cityId));
  if (filter.categorySlug) {
    conditions.push(eq(businessCategories.slug, filter.categorySlug));
  }
  if (filter.lat != null && filter.lng != null) {
    const radius = filter.radiusKm ?? 10;
    const { latDelta, lngDelta } = box(filter.lat, filter.lng, radius);
    conditions.push(sql`${businesses.lat} is not null`);
    conditions.push(
      sql`${businesses.lat}::float8 between ${filter.lat - latDelta} and ${filter.lat + latDelta}`,
    );
    conditions.push(
      sql`${businesses.lng}::float8 between ${filter.lng - lngDelta} and ${filter.lng + lngDelta}`,
    );
  }

  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      category: businessCategories.name,
      address: businesses.address,
      city: cities.name,
      whatsapp: businesses.whatsapp,
      link: businesses.link,
      lat: businesses.lat,
      lng: businesses.lng,
      distanceKm: distance,
    })
    .from(businesses)
    .innerJoin(businessCategories, eq(businesses.categoryId, businessCategories.id))
    .leftJoin(cities, eq(businesses.cityId, cities.id))
    .where(and(...conditions, eq(businessCategories.active, true)))
    .orderBy(filter.lat != null ? distance : asc(businesses.name))
    .limit(50);

  return rows.map((row) => ({
    ...row,
    lat: toNumber(row.lat),
    lng: toNumber(row.lng),
    distanceKm: row.distanceKm == null ? null : Number(row.distanceKm),
    sponsored: true,
  }));
}
