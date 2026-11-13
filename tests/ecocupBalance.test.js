import test from "node:test";
import assert from "node:assert/strict";
import { ecocupBalance } from "../src/ecocupBalance.js";
const movement = (id, kind, qty) => ({ id, values: [kind, qty, "Fête"] });
test("entrées, sorties et alerte au seuil", () => {
  assert.deepEqual(ecocupBalance([movement("a","Entrée","20"),movement("b","Sortie","5")],0,15), {ok:true,balance:15,threshold:15,alert:true});
});
test("alerte désactivée au-dessus du seuil", () => assert.equal(ecocupBalance([movement("a","Entrée","21")],0,20).alert,false));
test("sortie excessive rejetée", () => assert.equal(ecocupBalance([movement("a","Sortie","1")]).ok,false));
test("doublon rejeté", () => assert.equal(ecocupBalance([movement("a","Entrée","1"),movement("a","Entrée","1")]).ok,false));
test("quantité décimale rejetée", () => assert.equal(ecocupBalance([movement("a","Entrée","1.5")]).ok,false));
test("valeur non numérique rejetée", () => assert.equal(ecocupBalance([movement("a","Entrée","abc")]).ok,false));
test("type non reconnu rejeté", () => assert.equal(ecocupBalance([movement("a","Perte","2")]).ok,false));
test("entiers trop grands rejetés", () => assert.equal(ecocupBalance([movement("a","Entrée","99999999999999999999")]).ok,false));
test("seuil négatif rejeté", () => assert.equal(ecocupBalance([],0,-1).ok,false));
