import { connection } from "next/server";
import { isSlugAvailable } from "@/app/actions/profile";
import { auth } from "@/auth";
import { limitPublicApi } from "@/lib/rate-limit";

export async function GET(request: Request) {
  await connection();

  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ available: false, error: "Unauthorized" }, { status: 401 });
  }

  const limited = await limitPublicApi("slug-check");
  if (!limited.ok) {
    return Response.json(
      { available: false, error: limited.message },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      },
    );
  }

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || "";
  const result = await isSlugAvailable(slug, session.user.id);
  return Response.json(result);
}
