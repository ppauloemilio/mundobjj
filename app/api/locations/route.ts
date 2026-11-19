import { connection } from "next/server";
import { databaseError, listCities, listCountries, listStates } from "@/lib/catalog";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const iso2 = url.searchParams.get("country");
  const stateId = url.searchParams.get("state");

  try {
    if (stateId) {
      return Response.json({ cities: await listCities(stateId) });
    }

    if (iso2) {
      return Response.json({ states: await listStates(iso2) });
    }

    return Response.json({
      configured: Boolean(process.env.DATABASE_URL),
      countries: await listCountries(),
    });
  } catch (error) {
    return Response.json({
      configured: Boolean(process.env.DATABASE_URL),
      countries: [],
      states: [],
      cities: [],
      error: databaseError(error),
    });
  }
}
