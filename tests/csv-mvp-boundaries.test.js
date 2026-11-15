import test from 'node:test';
import assert from 'node:assert/strict';
import { exportCsv, FESTAPP_CSV_COLUMNS } from '../src/csv-export.js';

// Export must remain deterministic and safe for Excel FR, without any external service.
test('CSV exports all MVP categories, including empty datasets', () => {
  for (const [kind, columns] of Object.entries(FESTAPP_CSV_COLUMNS)) {
    const csv = exportCsv(columns, []);
    assert.ok(csv.startsWith('\uFEFF'), kind);
    assert.equal(csv.split('\r\n').length, 2, kind);
    assert.ok(csv.includes('"Identifiant"'), kind);
  }
});

test('CSV keeps accented names, contacts and separators in quoted cells', () => {
  const csv = exportCsv(FESTAPP_CSV_COLUMNS.people, [{
    id: 'contact-1', kind: 'benevole', display_name: 'Élodie; "Léa"',
    email: 'test@example.invalid', phone: '06 00 00 00 00'
  }]);
  assert.ok(csv.includes('"Élodie; ""Léa"""'));
  assert.ok(csv.includes('"test@example.invalid"'));
  assert.ok(csv.includes('"06 00 00 00 00"'));
});

test('CSV neutralizes formulas in both column headings and values', () => {
  const csv = exportCsv([{ key: 'v', label: '=HYPERLINK("bad")' }], [
    { v: '=1+1' }, { v: '\t@SUM(A1)' }, { v: '-1+2' }
  ]);
  assert.ok(csv.includes('"\'=HYPERLINK(""bad"")"'));
  assert.ok(csv.includes('"\'=1+1"'));
  assert.ok(csv.includes('"\'\t@SUM(A1)"'));
  assert.ok(csv.includes('"\'-1+2"'));
});

test('CSV missing values are empty, and does not alter source objects', () => {
  const row = Object.freeze({ id: 'event-1' });
  const cols = Object.freeze([{ key: 'id', label: 'ID' }, { key: 'name', label: 'Nom' }]);
  const csv = exportCsv(cols, [row]);
  assert.equal(csv, '\uFEFF"ID";"Nom"\r\n"event-1";""\r\n');
  assert.deepEqual(row, { id: 'event-1' });
});
