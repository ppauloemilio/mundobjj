import { connection } from "next/server";
import { searchAcademies, searchStores } from "@/lib/search";

function numberParam(value: string | null) {
  if (!value) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const layer = url.searchParams.get("layer") === "stores" ? "stores" : "academies";
  const filter = {
    cityId: url.searchParams.get("cityId") || undefined,
    lat: numberParam(url.searchParams.get("lat")),
    lng: numberParam(url.searchParams.get("lng")),
    radiusKm: numberParam(url.searchParams.get("radius")) ?? 10,
    categorySlug: url.searchParams.get("category") || undefined,
  };

  const configured = Boolean(process.env.DATABASE_URL);
  if (!configured) {
    return Response.json({ configured, layer, results: [] });
  }

  const results =
    layer === "stores"
      ? await searchStores(filter)
      : await searchAcademies(filter);

  return Response.json({ configured, layer, results });
}
