import test from "node:test";
import assert from "node:assert/strict";
import { buildCsv, escapeCsvCell } from "../src/lib/csv.js";

test("contact names and accents round-trip as quoted UTF-8 CSV cells", () => {
  const csv = buildCsv(["Nom", "Téléphone"], [["Élodie; Martin", "06 12 34 56 78"]]);
  assert.equal(csv, '\uFEFF"Nom";"Téléphone"\r\n"Élodie; Martin";"06 12 34 56 78"');
});

test("untrusted contact fields cannot start spreadsheet formulas", () => {
  for (const input of ["=1+1", "+SUM(1,2)", "-2+3", "@SUM(1,2)", "  =HYPERLINK(1)", "\u200B=1+1", "\u202E=1+1", "\t=1+1"]) {
    assert.equal(escapeCsvCell(input), '"' + "'" + input + '"', input);
  }
});

test("quotes and newlines remain quoted and escaped", () => {
  assert.equal(escapeCsvCell('Association "Les Amis"\nLiernais'), '"Association ""Les Amis""\nLiernais"');
});

test("invalid CSV row width fails closed instead of silently dropping contact data", () => {
  assert.throws(() => buildCsv(["Nom", "Mail"], [["Association"]]), RangeError);
});
