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

export function requireDb(): Database {
  const db = getDb();
  if (!db) {
    throw new Error("DATABASE_URL não configurada.");
  }
  return db;
}
