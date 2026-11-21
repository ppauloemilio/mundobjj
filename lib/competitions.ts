import type { Locale } from "@/lib/i18n/config";

export type CompetitionResult = "GOLD" | "SILVER" | "BRONZE" | "PARTICIPATED";
export type CompetitionModality = "GI" | "NOGI";
export type CompetitionFederation =
  | "CBJJ"
  | "IBJJF"
  | "CBJJO"
  | "STATE"
  | "LOCAL"
  | "OTHER";

export type CompetitionRow = {
  id: string;
  name: string;
  eventDate: string;
  city: string | null;
  countryCode: string | null;
  federation: CompetitionFederation;
  belt: string;
  weightClass: string | null;
  ageClass: string;
  modality: CompetitionModality;
  isAbsolute: boolean;
  result: CompetitionResult;
  podiumPhotoUrl: string | null;
  bracketUrl: string | null;
  hidden: boolean;
  verifiedAt: Date | string | null;
  verifiedByProfessorId: string | null;
};

export function medalCounts(rows: CompetitionRow[]) {
  let gold = 0;
  let silver = 0;
  let bronze = 0;
  for (const row of rows) {
    if (row.result === "GOLD") gold += 1;
    if (row.result === "SILVER") silver += 1;
    if (row.result === "BRONZE") bronze += 1;
  }
  return {
    gold,
    silver,
    bronze,
    medals: gold + silver + bronze,
    championships: rows.length,
  };
}

export function resultRank(row: CompetitionRow) {
  if (row.result === "GOLD" && row.isAbsolute) return 400;
  if (row.result === "GOLD") return 300;
  if (row.result === "SILVER") return 200;
  if (row.result === "BRONZE") return 100;
  return 0;
}

export function bestCompetition(rows: CompetitionRow[]) {
  if (!rows.length) return null;
  return [...rows].sort((a, b) => {
    const diff = resultRank(b) - resultRank(a);
    if (diff !== 0) return diff;
    return b.eventDate.localeCompare(a.eventDate);
  })[0];
}

export function competitionYears(rows: CompetitionRow[]) {
  const years = new Set(rows.map((row) => row.eventDate.slice(0, 4)));
  return [...years].sort((a, b) => b.localeCompare(a));
}

export function filterCompetitions(
  rows: CompetitionRow[],
  opts: { year?: string | "all"; modality?: "all" | "GI" | "NOGI" },
) {
  return rows.filter((row) => {
    if (opts.year && opts.year !== "all" && !row.eventDate.startsWith(opts.year)) {
      return false;
    }
    if (opts.modality && opts.modality !== "all" && row.modality !== opts.modality) {
      return false;
    }
    return true;
  });
}

export function resultColor(result: CompetitionResult) {
  if (result === "GOLD") return "var(--gold)";
  if (result === "SILVER") return "var(--silver)";
  if (result === "BRONZE") return "var(--bronze)";
  return "var(--line)";
}

export function formatEventDate(value: string, locale: Locale) {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === "pt" ? "pt-BR" : "en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}
