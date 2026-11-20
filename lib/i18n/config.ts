export const locales = ["pt", "en"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "pt";
export const localeCookie = "mbjj_locale";

export function isLocale(value: string | undefined | null): value is Locale {
  return value === "pt" || value === "en";
}

export function localeTag(locale: Locale) {
  return locale === "pt" ? "pt-BR" : "en";
}
