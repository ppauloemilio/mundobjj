import { connection } from "next/server";
import { auth } from "@/auth";
import { limitPublicApi } from "@/lib/rate-limit";
import { resolveLocationToCityId } from "@/lib/location-input";

export async function POST(request: Request) {
  await connection();

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized", cityId: null }, { status: 401 });
  }

  const limited = await limitPublicApi("geo-resolve");
  if (!limited.ok) {
    return Response.json(
      { error: limited.message, cityId: null },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ cityId: null, configured: false });
  }

  let body: {
    countryIso2?: string;
    stateCode?: string;
    cityName?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "Invalid JSON", cityId: null }, { status: 400 });
  }

  const cityId = await resolveLocationToCityId(
    {
      cityId: null,
      countryMode: "list",
      stateMode: "list",
      cityMode: "list",
      countryIso2: body.countryIso2,
      stateCode: body.stateCode,
      cityName: body.cityName,
    },
    session.user.id,
  );

  return Response.json({ cityId, configured: true });
}
