import { connection } from "next/server";
import { databaseError } from "@/lib/catalog";
import { limitPublicApi } from "@/lib/rate-limit";
import { searchAcademies, searchStores } from "@/lib/search";

function numberParam(value: string | null) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export async function GET(request: Request) {
  await connection();

  const limited = await limitPublicApi("search");
  if (!limited.ok) {
    return Response.json(
      { error: limited.message, configured: true, results: [] },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const url = new URL(request.url);
  const layer = url.searchParams.get("layer") === "stores" ? "stores" : "academies";
  const kinds = url.searchParams.getAll("kind").filter(Boolean);
  const filter = {
    cityId: url.searchParams.get("cityId") || undefined,
    lat: numberParam(url.searchParams.get("lat")),
    lng: numberParam(url.searchParams.get("lng")),
    radiusKm: numberParam(url.searchParams.get("radius")) ?? 10,
    categorySlug: url.searchParams.get("category") || undefined,
    q: url.searchParams.get("q") || undefined,
    acceptsVisitor: url.searchParams.get("visitor") === "1",
    classKinds: kinds.length ? kinds : undefined,
    todayOnly: url.searchParams.get("today") === "1",
  };

  const configured = Boolean(process.env.DATABASE_URL);
  if (!configured) {
    return Response.json({ configured, layer, results: [] });
  }

  try {
    const results =
      layer === "stores" ? await searchStores(filter) : await searchAcademies(filter);

    return Response.json({ configured, layer, results });
  } catch (error) {
    return Response.json({
      configured,
      layer,
      results: [],
      error: databaseError(error),
    });
  }
}
