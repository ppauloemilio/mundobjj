import { connection } from "next/server";
import { databaseError } from "@/lib/catalog";
import { limitPublicApi } from "@/lib/rate-limit";
import { listAcademyMapPins } from "@/lib/search";

export async function GET() {
  await connection();

  const limited = await limitPublicApi("map");
  if (!limited.ok) {
    return Response.json(
      { error: limited.message, configured: true, pins: [] },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const configured = Boolean(process.env.DATABASE_URL);
  if (!configured) {
    return Response.json({ configured, pins: [] });
  }

  try {
    const pins = await listAcademyMapPins();
    return Response.json({ configured, pins });
  } catch (error) {
    return Response.json({
      configured,
      pins: [],
      error: databaseError(error),
    });
  }
}