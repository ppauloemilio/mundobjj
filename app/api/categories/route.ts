import { connection } from "next/server";
import { listCategories } from "@/lib/catalog";

export async function GET() {
  await connection();

  return Response.json({
    configured: Boolean(process.env.DATABASE_URL),
    categories: await listCategories(),
  });
}
