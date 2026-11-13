import test from "node:test";
import assert from "node:assert/strict";
import { validateMovement, calculateEcocupInventory, appendEcocupMovement } from "../src/lib/ecocups.js";

const make = (type, quantity, id, extra = {}) => ({
  id, type, quantity, at: "2026-11-13T12:00:00Z", author: "bureau", ...extra
});
const initial = make("initial", 200, "initial-1");
test("inventaire initial, sortie et retour partiel", () => {
  const movements = [initial, make("sortie", 60, "s1", {eventId:"belote"}), make("retour", 45, "r1", {eventId:"belote"})];
  assert.equal(calculateEcocupInventory(movements, 180).quantity, 185);
  assert.equal(calculateEcocupInventory(movements, 190).lowStock, true);
});
test("interdit le stock négatif", () => {
  assert.throws(() => calculateEcocupInventory([initial, make("sortie", 201, "s1", {eventId:"belote"})]), /Stock insuffisant/);
});
test("refuse doublons d'identifiant", () => {
  assert.throws(() => calculateEcocupInventory([initial, make("achat", 2, "initial-1")]), /doublon/);
});
test("refuse mouvement sans initial", () => {
  assert.throws(() => calculateEcocupInventory([make("achat", 10, "a1")]), /initial manquant/);
});
test("refuse deux inventaires initiaux", () => {
  assert.throws(() => calculateEcocupInventory([initial, make("initial", 10, "i2")]), /unique/);
});
test("refuse quantité non entière et type inconnu", () => {
  assert.throws(() => validateMovement(make("achat", 1.5, "a1")), /entière/);
  assert.throws(() => validateMovement(make("vente", 1, "a2")), /inconnu/);
});
test("corrections historisées avec motif obligatoire", () => {
  assert.throws(() => validateMovement(make("correction_moins", 3, "c1")), /Motif/);
  const result = appendEcocupMovement([initial], make("correction_moins", 3, "c1", {reason:"Casse constatée"}));
  assert.equal(result.inventory.quantity, 197);
  assert.equal(result.movements.length, 2);
});
test("alerte seulement après inventaire initial", () => {
  assert.deepEqual(calculateEcocupInventory([], 100), {quantity:0, threshold:100, lowStock:false, initialized:false, movementCount:0});
  assert.equal(calculateEcocupInventory([initial], 200).lowStock, true);
});
test("refuse seuil invalide et dépassement numérique", () => {
  assert.throws(() => calculateEcocupInventory([initial], -1), /Seuil/);
  assert.throws(() => calculateEcocupInventory([make("initial", Number.MAX_SAFE_INTEGER, "i"), make("achat", 1, "a")]), /dépassement/);
});
