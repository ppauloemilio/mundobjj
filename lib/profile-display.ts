import type { Locale } from "@/lib/i18n/config";

export const weightCategories = [
  "feather",
  "light",
  "middle",
  "medium_heavy",
  "heavy",
  "super_heavy",
  "ultra_heavy",
] as const;

export type WeightCategory = (typeof weightCategories)[number];

const weightLabels: Record<WeightCategory, { pt: string; en: string }> = {
  feather: { pt: "Pena", en: "Feather" },
  light: { pt: "Leve", en: "Light" },
  middle: { pt: "Médio", en: "Middle" },
  medium_heavy: { pt: "Meio-pesado", en: "Medium heavy" },
  heavy: { pt: "Pesado", en: "Heavy" },
  super_heavy: { pt: "Super-pesado", en: "Super heavy" },
  ultra_heavy: { pt: "Pesadíssimo", en: "Ultra heavy" },
};

export function weightCategoryLabel(
  value: string | null | undefined,
  locale: Locale,
) {
  if (!value || !(value in weightLabels)) return null;
  return weightLabels[value as WeightCategory][locale];
}

export function matsTimeLabel(
  startedAt: string | null | undefined,
  locale: Locale,
  now = new Date(),
) {
  if (!startedAt) return null;
  const start = new Date(`${startedAt}T12:00:00`);
  if (Number.isNaN(start.getTime()) || start > now) return null;

  let months =
    (now.getFullYear() - start.getFullYear()) * 12 +
    (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) months = 0;

  const years = Math.floor(months / 12);
  const rem = months % 12;

  if (locale === "en") {
    if (years === 0 && rem === 0) return "Just started on the mats";
    if (years === 0) return `${rem} mo on the mats`;
    if (rem === 0) return `${years} yr${years > 1 ? "s" : ""} on the mats`;
    return `${years} yr${years > 1 ? "s" : ""} ${rem} mo on the mats`;
  }

  if (years === 0 && rem === 0) return "Recém-chegado no tatame";
  if (years === 0) return `${rem} ${rem === 1 ? "mês" : "meses"} de tatame`;
  if (rem === 0) return `${years} ${years === 1 ? "ano" : "anos"} de tatame`;
  return `${years} ${years === 1 ? "ano" : "anos"} e ${rem} ${rem === 1 ? "mês" : "meses"} de tatame`;
}

/** Digits-only BR-friendly input → E.164 (+55…). */
export function toE164Whatsapp(raw: string, defaultCountry = "55") {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (raw.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  if (digits.startsWith(defaultCountry) && digits.length >= 12) {
    return `+${digits}`;
  }
  if (digits.length >= 10 && digits.length <= 11) {
    return `+${defaultCountry}${digits}`;
  }
  if (digits.length >= 12) return `+${digits}`;
  return null;
}

export function formatWhatsappDisplay(e164: string | null | undefined) {
  if (!e164) return "";
  const digits = e164.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) {
    const ddd = digits.slice(2, 4);
    const rest = digits.slice(4);
    if (rest.length === 9) {
      return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
    }
    if (rest.length === 8) {
      return `+55 (${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
    }
  }
  return e164.startsWith("+") ? e164 : `+${digits}`;
}

export function maskWhatsappInput(raw: string) {
  const digits = raw.replace(/\D/g, "").slice(0, 13);
  if (!digits) return "";
  if (digits.length <= 2) return `+${digits}`;
  if (digits.startsWith("55")) {
    const local = digits.slice(2);
    if (local.length === 0) return "+55";
    if (local.length <= 2) return `+55 (${local}`;
    const ddd = local.slice(0, 2);
    const rest = local.slice(2);
    if (rest.length <= 5) return `+55 (${ddd}) ${rest}`;
    return `+55 (${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
  }
  return `+${digits}`;
}

export const adultBeltColors: Record<string, string> = {
  white: "#f5f5f5",
  blue: "#1d4ed8",
  purple: "#7e22ce",
  brown: "#7c2d12",
  black: "#17161b",
};

export const kidBeltColors: Record<string, string> = {
  gray: "#9ca3af",
  yellow: "#eab308",
  orange: "#f97316",
  green: "#16a34a",
};
