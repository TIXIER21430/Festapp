import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Guardrails for the local-first MVP. These checks deliberately inspect the
// shipped entrypoint, not a test fixture. They do not validate Supabase RLS.
const app = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const storage = readFileSync(new URL("../src/lib/demoStorage.js", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("demo UI clearly identifies local storage before TEST sync activation", () => {
  assert.match(app, /Mode démonstration/);
  assert.match(app, /Tes saisies restent sur cet appareil jusqu’à l’activation de la synchronisation TEST/);
  assert.match(app, /fiches locales par défaut/);
});

test("demo records stay in the explicitly named local namespace", () => {
  assert.match(storage, /DEMO_STORAGE_KEY = "festapp-demo-v1"/);
  assert.match(storage, /storage\.setItem\(DEMO_STORAGE_KEY,JSON\.stringify\(validated\)\)/);
  assert.match(app, /writeDemoStorage\(localStorage,data\)/);
  assert.match(app, /readDemoStorage\(localStorage,seed\)/);
  assert.doesNotMatch(app, /(?:supabase\.|createClient\(|fetch\(\s*["'`]https?:\/\/)/);
});

test("restore is previewed and requires explicit user confirmation", () => {
  assert.match(app, /inspectDemoBackupReadiness\(json\)/);
  assert.match(app, /planDemoRestore\(data,json\)/);
  assert.match(app, /sourceSnapshot:JSON\.stringify\(data\)/);
  assert.match(app, /confirmed:true/);
  assert.match(app, /confirm\("Ajouter les fiches absentes/);
});

test("CI commands never deploy or apply migrations", () => {
  for (const command of Object.values(packageJson.scripts)) {
    assert.doesNotMatch(command, /\b(?:deploy|db push|migration up|db reset)\b/i);
  }
});
