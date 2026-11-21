import { connection } from "next/server";
import { auth } from "@/auth";
import { getProfileForUser } from "@/lib/session";
import { getCityCenter } from "@/lib/search";

export async function GET() {
  await connection();
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ location: null });
  }

  const profile = await getProfileForUser(session.user.id);
  if (!profile?.cityId) {
    return Response.json({
      location: null,
      belt: profile?.belt ?? null,
      cityName: null,
    });
  }

  const center = await getCityCenter(profile.cityId);
  return Response.json({
    location: center,
    belt: profile.belt,
    cityName: center?.cityName ?? null,
  });
}
