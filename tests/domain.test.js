import test from "node:test";
import assert from "node:assert/strict";
import { parseAmount, financeNature, eventDate } from "../src/domain.js";

test("montants français acceptés", () => {
  assert.equal(parseAmount("2,50"), 2.5);
  assert.equal(parseAmount("10.00"), 10);
  assert.equal(parseAmount("0"), 0);
});
test("montants non fiables rejetés", () => {
  for (const amount of ["", "-20", "12.345", "abc", "Infinity", "1 000"]) {
    assert.equal(parseAmount(amount), null);
  }
});
test("catégories comptables reconnues", () => {
  assert.equal(financeNature("recette"), "Recette");
  assert.equal(financeNature("DEPENSE"), "Dépense");
  assert.equal(financeNature("Dépense"), "Dépense");
  assert.equal(financeNature("autre"), null);
});
test("dates du calendrier valides", () => {
  assert.equal(eventDate("2028-02-29")?.getDate(), 29);
  assert.equal(eventDate("2027-02-29"), null);
  assert.equal(eventDate("2026-13-01"), null);
  assert.equal(eventDate("31/12/2026"), null);
});
