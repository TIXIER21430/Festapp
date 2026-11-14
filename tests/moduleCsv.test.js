import test from "node:test";
import assert from "node:assert/strict";
import { exportModuleCsv, EXPORT_COLUMNS } from "../src/lib/moduleCsv.js";

test("all six MVP modules export a stable header even when empty", () => {
  for (const [moduleName, columns] of Object.entries(EXPORT_COLUMNS)) {
    assert.equal(exportModuleCsv(moduleName, []), "\uFEFF" + columns.map(c => '"' + c + '"').join(";"));
  }
});

test("exports only allowed columns and keeps Unicode", () => {
  const csv = exportModuleCsv("benevoles", [{ id: "1", nom: "Élodie", prenom: "Zoé", email: "", telephone: "0123", secret: "private" }]);
  assert.match(csv, /Élodie/);
  assert.doesNotMatch(csv, /private|secret/);
});

test("rejects formula injection via existing CSV escaping", () => {
  assert.match(exportModuleCsv("groupes", [{ nom: "=1+1" }]), /"'=1\+1"/);
});

test("rejects invalid records, module and nested values", () => {
  assert.throws(() => exportModuleCsv("unknown", []), RangeError);
  assert.throws(() => exportModuleCsv("taches", {}), TypeError);
  assert.throws(() => exportModuleCsv("taches", [null]), TypeError);
  assert.throws(() => exportModuleCsv("taches", [{ titre: { nested: true } }]), TypeError);
  assert.throws(() => exportModuleCsv("ecocups", [{ quantite: Infinity }]), TypeError);
});

test("preserves CSV quoting and line breaks", () => {
  const csv = exportModuleCsv("manifestations", [{ nom: 'Marché "Noël"\nLiernais' }]);
  assert.match(csv, /"Marché ""Noël""\nLiernais"/);
});
