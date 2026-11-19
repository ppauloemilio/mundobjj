import { connection } from "next/server";
import { databaseError } from "@/lib/catalog";
import { listAcademyMapPins } from "@/lib/search";

export async function GET() {
  await connection();
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