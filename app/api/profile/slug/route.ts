import { connection } from "next/server";
import { isSlugAvailable } from "@/app/actions/profile";
import { auth } from "@/auth";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const slug = url.searchParams.get("slug") || "";
  const session = await auth();
  const result = await isSlugAvailable(slug, session?.user?.id);
  return Response.json(result);
}
