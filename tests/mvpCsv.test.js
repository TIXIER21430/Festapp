import test from 'node:test';
import assert from 'node:assert/strict';
import { exportMvpCsv, MVP_CSV_COLUMNS } from '../src/mvpCsv.js';

test('six collections MVP exportables', () => {
  assert.equal(Object.keys(MVP_CSV_COLUMNS).length, 6);
  for (const collection of Object.keys(MVP_CSV_COLUMNS)) {
    assert.ok(exportMvpCsv(collection, []).includes('"id"'));
  }
});
test('CSV with BOM, separator, CRLF and escaping', () => {
  const csv = exportMvpCsv('benevoles', [{ id: '1', nom: 'A;"B"\\nC' }]);
  assert.ok(csv.startsWith('\\uFEFF'));
  assert.ok(csv.includes('"A;""B""\\nC"'));
  assert.ok(csv.endsWith('\\r\\n'));
});
test('neutralizes spreadsheet formulas and leading whitespace', () => {
  const csv = exportMvpCsv('benevoles', [{ id: '=1+1', nom: '  @SUM(1)', prenom: '+cmd', email: '-1' }]);
  for (const value of ["'=1+1", "'  @SUM(1)", "'+cmd", "'-1"]) assert.ok(csv.includes(value));
});
test('does not mutate original rows', () => {
  const row = Object.freeze({ id: '=42' });
  exportMvpCsv('groupes', [row]);
  assert.equal(row.id, '=42');
});
test('rejects unknown collection, malformed rows and separator', () => {
  assert.throws(() => exportMvpCsv('autre', []));
  assert.throws(() => exportMvpCsv('groupes', {}));
  assert.throws(() => exportMvpCsv('groupes', [null]));
  assert.throws(() => exportMvpCsv('groupes', [], { separator: '\\t' }));
});
