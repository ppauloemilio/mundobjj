import { connection } from "next/server";
import { and, asc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { academies, cities } from "@/db/schema";
import { databaseError } from "@/lib/catalog";

export async function GET() {
  await connection();

  try {
    const db = getDb();
    if (!db) {
      return Response.json({ configured: false, academies: [] });
    }

    const rows = await db
      .select({
        id: academies.id,
        name: academies.name,
        city: cities.name,
      })
      .from(academies)
      .leftJoin(cities, eq(academies.cityId, cities.id))
      .where(and(isNull(academies.blockedAt), isNull(academies.suspendedAt)))
      .orderBy(asc(academies.name));

    return Response.json({ configured: true, academies: rows });
  } catch (error) {
    return Response.json({
      configured: Boolean(process.env.DATABASE_URL),
      academies: [],
      error: databaseError(error),
    });
  }
}
