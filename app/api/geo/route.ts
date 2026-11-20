import { connection } from "next/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import {
  listWorldCities,
  listWorldCountries,
  listWorldStates,
} from "@/lib/world-geo";

function readLocale(request: Request): Locale {
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("locale");
  if (isLocale(fromQuery)) return fromQuery;
  return "pt";
}

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const locale = readLocale(request);
  const country = url.searchParams.get("country");
  const state = url.searchParams.get("state");

  if (country && state) {
    return Response.json({
      cities: listWorldCities(country, state, locale),
    });
  }

  if (country) {
    return Response.json({
      states: listWorldStates(country, locale),
    });
  }

  return Response.json({
    countries: listWorldCountries(locale),
  });
}
