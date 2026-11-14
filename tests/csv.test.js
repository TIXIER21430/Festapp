import test from "node:test";
import assert from "node:assert/strict";
import { buildCsv, escapeCsvCell } from "../src/lib/csv.js";

test("UTF-8 BOM, semicolon, quotes and newlines", () => {
  assert.equal(buildCsv(["Nom", "Contact"], [["Élodie; A", 'a"b\nligne']]),
    '\uFEFF"Nom";"Contact"\r\n"Élodie; A";"a""b\nligne"');
});
test("formula injection is neutralized for spreadsheet consumers", () => {
  for (const cell of ["=1+1", "+SUM(A1)", "-1+2", "@cmd", "  =1+1", "\t=1+1", "\n=1+1"]) {
    assert.equal(escapeCsvCell(cell), '"\'' + cell.replaceAll('"', '""') + '"');
  }
});
test("normal values and missing cells", () => {
  assert.equal(escapeCsvCell(null), '""');
  assert.equal(escapeCsvCell("Jean"), '"Jean"');
  assert.equal(escapeCsvCell(42), '"42"');
});
test("mismatched records fail instead of silently losing fields", () => {
  assert.throws(() => buildCsv(["a", "b"], [["only one"]]), RangeError);
  assert.throws(() => buildCsv("a", []), TypeError);
});
