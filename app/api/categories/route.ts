import { connection } from "next/server";
import { databaseError, listCategories } from "@/lib/catalog";

export async function GET() {
  await connection();

  try {
    return Response.json({
      configured: Boolean(process.env.DATABASE_URL),
      categories: await listCategories(),
    });
  } catch (error) {
    return Response.json({
      configured: Boolean(process.env.DATABASE_URL),
      categories: [],
      error: databaseError(error),
    });
  }
}
