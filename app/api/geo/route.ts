import { connection } from "next/server";
import {
  listWorldCities,
  listWorldCountries,
  listWorldStates,
} from "@/lib/world-geo";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const country = url.searchParams.get("country");
  const state = url.searchParams.get("state");

  if (country && state) {
    return Response.json({
      cities: listWorldCities(country, state),
    });
  }

  if (country) {
    return Response.json({
      states: listWorldStates(country),
    });
  }

  return Response.json({
    countries: listWorldCountries(),
  });
}