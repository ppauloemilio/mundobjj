import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export type Database = NeonHttpDatabase<typeof schema>;

export function getDb(): Database | null {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  const sql = neon(url);
  return drizzle(sql, { schema });
}
