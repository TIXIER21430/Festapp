import test from "node:test";
import assert from "node:assert/strict";
import { inspectCsvPrivacy } from "../src/lib/csvPrivacyPreview.js";

test("flags personal contact exports without exposing values", () => {
  const preview = inspectCsvPrivacy("benevoles", [{ nom: "Alice", email: "alice@example.org" }]);
  assert.equal(preview.requiresPrivateHandling, true);
  assert.equal(preview.populatedContacts, 1);
  assert.equal(preview.rowCount, 1);
  assert.equal(JSON.stringify(preview).includes("alice@example.org"), false);
});
test("does not flag empty or non-contact exports", () => {
  assert.equal(inspectCsvPrivacy("benevoles", [{ email: "  " }]).requiresPrivateHandling, false);
  assert.equal(inspectCsvPrivacy("ecocups", [{ quantite: 12 }]).requiresPrivateHandling, false);
});
test("rejects invalid module, rows and contact types", () => {
  assert.throws(() => inspectCsvPrivacy("invalid", []), RangeError);
  assert.throws(() => inspectCsvPrivacy("groupes", {}), TypeError);
  assert.throws(() => inspectCsvPrivacy("groupes", [null]), TypeError);
  assert.throws(() => inspectCsvPrivacy("groupes", [{ email: { secret: "x" } }]), TypeError);
});
