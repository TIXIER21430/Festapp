import test from 'node:test';
import assert from 'node:assert/strict';
import { exportContactsCsv } from '../src/contactsCsv.js';

test('export UTF-8, accents et échappement CSV', () => {
  const csv = exportContactsCsv([{ id: '1', kind: 'volunteer', display_name: 'Léa "Test"', notes: 'ligne 1\nligne 2' }]);
  assert.ok(csv.startsWith('\uFEFFid,kind,'));
  assert.ok(csv.includes('"Léa ""Test"""'));
  assert.ok(csv.includes('"ligne 1\nligne 2"'));
});

test('neutralise les formules dangereuses', () => {
  const csv = exportContactsCsv([{ kind: 'exhibitor', display_name: '=1+1', email: '  @SUM(1)', phone: '+123', notes: '-1' }]);
  for (const value of ["'=1+1", "'  @SUM(1)", "'+123", "'-1"]) assert.ok(csv.includes(value));
});

test('refuse catégories inconnues et ne modifie pas les contacts', () => {
  assert.throws(() => exportContactsCsv([{kind:'admin'}]), TypeError);
  const contacts = Object.freeze([Object.freeze({kind:'group',display_name:'Groupe'})]);
  assert.ok(exportContactsCsv(contacts).includes('Groupe'));
});

test('neutralise les formules précédées de blancs Unicode ou de tabulations', () => {
  const csv = exportContactsCsv([{
    kind: 'volunteer',
    display_name: '\t=HYPERLINK("https://example.invalid")',
    email: '\u00a0+1+1',
    phone: '\uFEFF@SUM(1)',
    notes: '\u200B-2'
  }]);
  for (const value of ["'\t=HYPERLINK", "'\u00a0+1+1", "'\uFEFF@SUM", "'\u200B-2"]) {
    assert.ok(csv.includes(value), `formule non neutralisée : ${JSON.stringify(value)}`);
  }
});
