import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_ECOCUP_SETTINGS, parseDemoEcocupSettings, serializeDemoEcocupSettings } from "../src/lib/ecocupDemoSettings.js";

test("écocups : seuil et stock initial acceptent les limites entières sûres", () => {
  const settings = Object.freeze({ openingBalance: "9007199254740991", alertThreshold: "0" });
  const encoded = serializeDemoEcocupSettings(settings);
  assert.deepEqual(parseDemoEcocupSettings(encoded), settings);
  assert.deepEqual(settings, { openingBalance: "9007199254740991", alertThreshold: "0" });
});

test("écocups : restauration locale refuse les formats non canoniques", () => {
  for (const value of [" 1", "1 ", "+1", "00", "1.0", "1e2", "NaN", "Infinity", "９", "٠", "9007199254740992"]) {
    const input = JSON.stringify({ openingBalance: value, alertThreshold: "10" });
    assert.deepEqual(parseDemoEcocupSettings(input), DEFAULT_ECOCUP_SETTINGS, value);
    assert.throws(() => serializeDemoEcocupSettings({ openingBalance: value, alertThreshold: "10" }), TypeError, value);
  }
});

test("écocups : la lecture de préférences ne conserve ni ne modifie les champs inconnus", () => {
  const input = Object.freeze({ openingBalance: "10", alertThreshold: "5", internalNote: "donnée privée" });
  const serialized = serializeDemoEcocupSettings(input);
  assert.deepEqual(JSON.parse(serialized), { openingBalance: "10", alertThreshold: "5" });
  assert.equal(input.internalNote, "donnée privée");
});
