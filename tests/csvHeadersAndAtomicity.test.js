import test from "node:test";
import assert from "node:assert/strict";
import { buildCsv } from "../src/lib/csv.js";

// CSV headers are sometimes supplied by imported module definitions. They must
// receive the same spreadsheet-formula protection as user-entered contact data.
test("CSV protects dynamic headers as well as contact fields", () => {
  const csv = buildCsv(["=HYPERLINK(\"https://example.invalid\")", "Nom"], [
    ["\u202E=1+1", "Association; des fêtes"],
  ]);
  assert.ok(csv.startsWith("\uFEFF"));
  assert.ok(csv.includes('"\'=HYPERLINK(""https://example.invalid"")"'));
  assert.ok(csv.includes('"\'\u202E=1+1"'));
  assert.ok(csv.includes('"Association; des fêtes"'));
});

test("CSV rejects malformed header and data rows without partial output", () => {
  assert.throws(() => buildCsv(["Nom", "Téléphone"], [["Alice", "0600000000"], ["Bob"]]), RangeError);
  assert.throws(() => buildCsv(["Nom"], [null]), RangeError);
  assert.throws(() => buildCsv(["Nom"], ["Alice"]), RangeError);
});
