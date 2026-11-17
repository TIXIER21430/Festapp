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

test("invisible Unicode marks cannot conceal spreadsheet formulas", () => {
  for (const mark of ["\u200B", "\u200C", "\u200D", "\u200E", "\u200F", "\u2060", "\uFEFF"]) {
    const value = mark + "=1+1";
    assert.equal(escapeCsvCell(value), "\"\'" + value + "\"");
  }
  assert.equal(escapeCsvCell("\u200BJean"), "\"\u200BJean\"");
});

test("bidi controls and soft hyphen cannot hide a formula", () => {
  for (const mark of ["\u00AD", "\u034F", "\u202A", "\u202B", "\u202C", "\u202D", "\u202E", "\u2066", "\u2067", "\u2068", "\u2069"]) {
    const value = mark + "=2+2";
    assert.equal(escapeCsvCell(value), "\"" + "'" + value + "\"");
    assert.equal(escapeCsvCell("  " + value), "\"" + "'" + "  " + value + "\"");
    assert.equal(escapeCsvCell(mark + "Marie"), "\"" + mark + "Marie\"");
  }
});

test("contact export preserves accents, separators and phone numbers as text", () => {
  const csv = buildCsv(["Nom", "Téléphone", "Email"], [
    ["Léa; Martin", "06 01 02 03 04", "lea@example.fr"],
    ['Association "Les Amis"', "+33123456789", "contact@example.fr"],
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"Léa; Martin";"06 01 02 03 04";"lea@example.fr"'));
  assert.ok(csv.includes('"Association ""Les Amis""";"\'+33123456789";"contact@example.fr"'));
});

test("spreadsheet formulas in column headers are escaped too", () => {
  const csv = buildCsv(["=HYPERLINK(\"https://example.org\")", "Nom"], [["ok", "Marie"]]);
  assert.ok(csv.startsWith("\uFEFF\"'=HYPERLINK("));
  assert.ok(csv.endsWith('\r\n"ok";"Marie"'));
});

test("CSV export does not mutate source contact records", () => {
  const headers = Object.freeze(["Nom", "Téléphone"]);
  const row = Object.freeze(["=2+2", "06 12 34 56 78"]);
  const records = Object.freeze([row]);
  const csv = buildCsv(headers, records);
  assert.ok(csv.includes('"\'=2+2";"06 12 34 56 78"'));
  assert.deepEqual(headers, ["Nom", "Téléphone"]);
  assert.deepEqual(records, [["=2+2", "06 12 34 56 78"]]);
});

test("combined invisible controls cannot bypass formula escaping", () => {
  const prefix = "\u200B\u202E\u2060\t";
  for (const operator of ["=", "+", "-", "@"]) {
    assert.equal(escapeCsvCell(prefix + operator + "1"), '"\'' + prefix + operator + '1"');
  }
  // A leading tab is itself spreadsheet-sensitive, even without a formula operator.
  assert.equal(escapeCsvCell(prefix + "Association"), '"\'' + prefix + 'Association"');
  const invisibleOnly = "\u200B\u202E\u2060";
  assert.equal(escapeCsvCell(invisibleOnly + "Association"), '"' + invisibleOnly + 'Association"');
});


test("Arabic letter mark and Mongolian vowel separator cannot conceal formulas", () => {
  for (const mark of ["\u061C", "\u180E"]) {
    for (const operator of ["=", "+", "-", "@"]) {
      const value = mark + operator + "1";
      assert.equal(escapeCsvCell(value), '"\'' + value + '"');
    }
    assert.equal(escapeCsvCell(mark + "Association"), '"' + mark + 'Association"');
  }
});
