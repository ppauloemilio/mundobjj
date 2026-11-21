/**
 * IBJJF-style age: current calendar year − birth year.
 * @see IBJJF Rules / Graduation System
 */
export type AgeDivisionId =
  | "MIGHTY_MITE_1"
  | "MIGHTY_MITE_2"
  | "MIGHTY_MITE_3"
  | "PEE_WEE_1"
  | "PEE_WEE_2"
  | "PEE_WEE_3"
  | "JUNIOR_1"
  | "JUNIOR_2"
  | "JUNIOR_3"
  | "TEEN_1"
  | "TEEN_2"
  | "TEEN_3"
  | "JUVENILE_1"
  | "JUVENILE_2"
  | "ADULT"
  | "MASTER_1"
  | "MASTER_2"
  | "MASTER_3"
  | "MASTER_4"
  | "MASTER_5"
  | "MASTER_6"
  | "MASTER_7";

export type AgeDivision = {
  id: AgeDivisionId;
  /** IBJJF competition age (year-based). */
  competitionAge: number;
  /** Completed years from birthday to today. */
  chronologicalAge: number;
};

export function ibjjfCompetitionAge(
  birthDate: string,
  asOf: Date = new Date(),
): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const birthYear = Number(birthDate.slice(0, 4));
  if (!Number.isFinite(birthYear) || birthYear < 1920) return null;
  if (birthYear > asOf.getFullYear()) return null;
  return asOf.getFullYear() - birthYear;
}

export function chronologicalAgeYears(
  birthDate: string,
  asOf: Date = new Date(),
): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) return null;
  const [y, m, d] = birthDate.split("-").map(Number);
  if (!y || !m || !d) return null;
  let age = asOf.getFullYear() - y;
  const month = asOf.getMonth() + 1;
  const day = asOf.getDate();
  if (month < m || (month === m && day < d)) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

export function ageDivisionFromBirthDate(
  birthDate: string | null | undefined,
  asOf: Date = new Date(),
): AgeDivision | null {
  if (!birthDate) return null;
  const competitionAge = ibjjfCompetitionAge(birthDate, asOf);
  const chronologicalAge = chronologicalAgeYears(birthDate, asOf);
  if (competitionAge == null || chronologicalAge == null) return null;

  let id: AgeDivisionId;
  if (competitionAge <= 3) id = "MIGHTY_MITE_1";
  else if (competitionAge === 4) id = "MIGHTY_MITE_1";
  else if (competitionAge === 5) id = "MIGHTY_MITE_2";
  else if (competitionAge === 6) id = "MIGHTY_MITE_3";
  else if (competitionAge === 7) id = "PEE_WEE_1";
  else if (competitionAge === 8) id = "PEE_WEE_2";
  else if (competitionAge === 9) id = "PEE_WEE_3";
  else if (competitionAge === 10) id = "JUNIOR_1";
  else if (competitionAge === 11) id = "JUNIOR_2";
  else if (competitionAge === 12) id = "JUNIOR_3";
  else if (competitionAge === 13) id = "TEEN_1";
  else if (competitionAge === 14) id = "TEEN_2";
  else if (competitionAge === 15) id = "TEEN_3";
  else if (competitionAge === 16) id = "JUVENILE_1";
  else if (competitionAge === 17) id = "JUVENILE_2";
  else if (competitionAge >= 61) id = "MASTER_7";
  else if (competitionAge >= 56) id = "MASTER_6";
  else if (competitionAge >= 51) id = "MASTER_5";
  else if (competitionAge >= 46) id = "MASTER_4";
  else if (competitionAge >= 41) id = "MASTER_3";
  else if (competitionAge >= 36) id = "MASTER_2";
  else if (competitionAge >= 30) id = "MASTER_1";
  else id = "ADULT";

  return { id, competitionAge, chronologicalAge };
}

/** Maps IBJJF division to competition form age_class when useful. */
export function competitionAgeClassFromDivision(
  id: AgeDivisionId | null | undefined,
): string {
  if (!id) return "ADULT";
  if (id === "ADULT") return "ADULT";
  if (id === "MASTER_1") return "MASTER1";
  if (id === "MASTER_2") return "MASTER2";
  if (id === "MASTER_3") return "MASTER3";
  if (id === "MASTER_4") return "MASTER4";
  if (id === "MASTER_5") return "MASTER5";
  if (id === "MASTER_6") return "MASTER6";
  if (id === "MASTER_7") return "MASTER7";
  if (id.startsWith("JUVENILE")) return "JUVENILE";
  return "OTHER";
}
