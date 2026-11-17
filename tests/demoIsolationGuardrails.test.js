import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Guardrails for the local-only MVP. These checks deliberately inspect the
// shipped entrypoint, not a test fixture. They do not validate Supabase RLS.
const app = readFileSync(new URL("../src/main.jsx", import.meta.url), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("demo UI clearly identifies device-only storage", () => {
  assert.match(app, /Mode démonstration/);
  assert.match(app, /Données enregistrées uniquement sur cet appareil/);
  assert.match(app, /non partagées avec le bureau/);
});

test("demo records stay in the explicitly named local namespace", () => {
  assert.match(app, /const storageKey="festapp-demo-v1"/);
  assert.match(app, /localStorage\.setItem\(storageKey,JSON\.stringify\(data\)\)/);
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
