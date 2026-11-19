import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const app = readFileSync(new URL('../src/main.jsx', import.meta.url), 'utf8');
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

test('demo discloses local-first storage within optional settings', () => {
  assert.match(app, /Mode démonstration/);
  assert.match(app, /Les saisies restent sur cet appareil tant que la synchronisation n’est pas activée et vérifiée/);
  assert.match(app, /☁️ Sauvegarde et synchronisation/);
  assert.match(app, /aucun stock partagé/);
});

test('demo backup inspection does not perform a restore', () => {
  assert.match(app, /inspectDemoBackupReadiness\(json\)/);
  assert.match(app, /planDemoRestore\(data,json\)/);
  assert.match(app, /Aucune donnée importée ni envoyée/);
  assert.doesNotMatch(app, /setData\s*\(\s*plan\b/);
});

test('CSV export and mobile navigation remain accessible in demo', () => {
  assert.match(app, /buildCsv\(category==="contacts"\?CONTACT_EXPORT_COLUMNS:selected\.fields,rows\)/);
  assert.match(app, /Exporter une rubrique en CSV/);
  assert.match(app, /Télécharger CSV/);
  assert.match(app, /<nav aria-label="Modules">/);
  assert.match(app, /categories\.map\(c=>/);
});

test('no deployment or database migration scripts are introduced in package scripts', () => {
  const scripts = Object.keys(pkg.scripts || {});
  assert.deepEqual(scripts.sort(), ['build', 'dev', 'test']);
});
