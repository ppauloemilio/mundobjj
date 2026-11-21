import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ageDivisionFromBirthDate } from "@/lib/age-category";

describe("ageDivisionFromBirthDate", () => {
  it("uses IBJJF year-based age for Adult / Master", () => {
    const asOf = new Date("2026-06-15T12:00:00");
    assert.equal(
      ageDivisionFromBirthDate("1998-03-01", asOf)?.id,
      "ADULT",
    );
    assert.equal(
      ageDivisionFromBirthDate("1996-01-01", asOf)?.id,
      "MASTER_1",
    );
    assert.equal(
      ageDivisionFromBirthDate("1960-12-31", asOf)?.id,
      "MASTER_7",
    );
  });

  it("classifies juvenile by competition age 16–17", () => {
    const asOf = new Date("2026-01-01T12:00:00");
    assert.equal(
      ageDivisionFromBirthDate("2010-06-01", asOf)?.id,
      "JUVENILE_1",
    );
    assert.equal(
      ageDivisionFromBirthDate("2009-06-01", asOf)?.id,
      "JUVENILE_2",
    );
  });
});
