import { cookies } from "next/headers";
import {
  defaultLocale,
  isLocale,
  localeCookie,
  type Locale,
} from "@/lib/i18n/config";

export async function getRequestLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(localeCookie)?.value;
  return isLocale(value) ? value : defaultLocale;
}
