import { connection } from "next/server";
import { resolveLocationToCityId } from "@/lib/location-input";

export async function POST(request: Request) {
  await connection();
  if (!process.env.DATABASE_URL) {
    return Response.json({ cityId: null, configured: false });
  }

  const body = (await request.json()) as {
    countryIso2?: string;
    stateCode?: string;
    cityName?: string;
  };

  const cityId = await resolveLocationToCityId({
    cityId: null,
    countryMode: "list",
    stateMode: "list",
    cityMode: "list",
    countryIso2: body.countryIso2,
    stateCode: body.stateCode,
    cityName: body.cityName,
  });

  return Response.json({ cityId, configured: true });
}