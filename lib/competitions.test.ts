import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bestCompetition,
  filterCompetitions,
  medalCounts,
  type CompetitionRow,
} from "@/lib/competitions";

function row(
  partial: Partial<CompetitionRow> & Pick<CompetitionRow, "id" | "name" | "eventDate" | "result">,
): CompetitionRow {
  return {
    city: null,
    countryCode: null,
    federation: "IBJJF",
    belt: "blue",
    weightClass: "Leve",
    ageClass: "ADULT",
    modality: "GI",
    isAbsolute: false,
    podiumPhotoUrl: null,
    bracketUrl: null,
    hidden: false,
    verifiedAt: null,
    verifiedByProfessorId: null,
    ...partial,
  };
}

describe("medalCounts", () => {
  it("counts medals and championships", () => {
    const counts = medalCounts([
      row({ id: "1", name: "A", eventDate: "2024-01-01", result: "GOLD" }),
      row({ id: "2", name: "B", eventDate: "2024-02-01", result: "SILVER" }),
      row({ id: "3", name: "C", eventDate: "2023-03-01", result: "PARTICIPATED" }),
    ]);
    assert.equal(counts.gold, 1);
    assert.equal(counts.silver, 1);
    assert.equal(counts.bronze, 0);
    assert.equal(counts.medals, 2);
    assert.equal(counts.championships, 3);
  });
});

describe("bestCompetition", () => {
  it("prefers absolute gold, then gold, then recent", () => {
    const best = bestCompetition([
      row({ id: "1", name: "Silver", eventDate: "2025-01-01", result: "SILVER" }),
      row({
        id: "2",
        name: "Gold abs",
        eventDate: "2024-01-01",
        result: "GOLD",
        isAbsolute: true,
      }),
      row({ id: "3", name: "Gold", eventDate: "2025-06-01", result: "GOLD" }),
    ]);
    assert.equal(best?.id, "2");
  });
});

describe("filterCompetitions", () => {
  it("filters by year and modality", () => {
    const rows = [
      row({
        id: "1",
        name: "A",
        eventDate: "2024-05-01",
        result: "GOLD",
        modality: "GI",
      }),
      row({
        id: "2",
        name: "B",
        eventDate: "2025-05-01",
        result: "GOLD",
        modality: "NOGI",
      }),
    ];
    assert.equal(filterCompetitions(rows, { year: "2024" }).length, 1);
    assert.equal(filterCompetitions(rows, { modality: "NOGI" })[0]?.id, "2");
  });
});

describe("authorization ownership", () => {
  it("user A cannot mutate user B competition in an ownership check", () => {
    const store = new Map<string, { id: string; profileId: string; name: string }>([
      ["c1", { id: "c1", profileId: "profile-a", name: "Open" }],
      ["c2", { id: "c2", profileId: "profile-b", name: "Secret" }],
    ]);

    function mutateAs(actorProfileId: string, competitionId: string, name: string) {
      const item = store.get(competitionId);
      if (!item || item.profileId !== actorProfileId) {
        return { error: "Sem permissão." as const };
      }
      item.name = name;
      return { success: true as const };
    }

    assert.equal(mutateAs("profile-a", "c2", "Hacked").error, "Sem permissão.");
    assert.equal(store.get("c2")?.name, "Secret");
    assert.equal(mutateAs("profile-b", "c2", "Updated").success, true);
    assert.equal(store.get("c2")?.name, "Updated");
  });
});
