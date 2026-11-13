import test from "node:test";
import assert from "node:assert/strict";
import { checklistTemplates, createChecklistItems, checklistProgress } from "../src/checklists.js";

test("les modèles possèdent des tâches distinctes", () => {
  for (const items of Object.values(checklistTemplates)) {
    assert.ok(items.length >= 5);
    assert.equal(new Set(items).size, items.length);
  }
});
test("ajouter un modèle à une manifestation", () => {
  let id = 0;
  const entries = createChecklistItems("Marché de Noël", "Marché de Noël", () => String(++id));
  assert.equal(entries.length, checklistTemplates["Marché de Noël"].length);
  assert.ok(entries.every(r => r.values[0] === "Marché de Noël" && r.values[4] === "À faire"));
  assert.equal(new Set(entries.map(r => r.id)).size, entries.length);
});
test("aucune tâche sans manifestation ou modèle reconnu", () => {
  assert.deepEqual(createChecklistItems("", "Marché de Noël", () => "x"), []);
  assert.deepEqual(createChecklistItems("Fête", "inconnu", () => "x"), []);
});
test("le pourcentage ne mélange pas les manifestations", () => {
  const rows = [
    { values: ["Fête", "Salle", "", "", "Terminée"] },
    { values: ["Fête", "Courses", "", "", "À faire"] },
    { values: ["Autre", "Bilan", "", "", "Terminée"] }
  ];
  assert.deepEqual(checklistProgress(rows, "Fête"), {total:2,done:1,percent:50});
  assert.deepEqual(checklistProgress(rows, "Autre"), {total:1,done:1,percent:100});
  assert.deepEqual(checklistProgress(rows, "Inconnue"), {total:0,done:0,percent:0});
});
