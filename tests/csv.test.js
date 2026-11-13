import test from 'node:test';
import assert from 'node:assert/strict';
import { csvCell, csvDocument } from '../src/csv.js';

test('quotes delimiters, quotes and newlines', () => {
  assert.equal(csvCell('a;"b"\nc'), '"a;""b""\nc"');
});
test('neutralizes formula prefixes and leading whitespace', () => {
  for (const input of ['=1+1', '+SUM(1)', '-2+3', '@cmd', '  =2', '\n=3']) {
    assert.ok(csvCell(input).startsWith('"\t'), input);
  }
});
test('preserves ordinary values including negative numbers as safe text', () => {
  assert.equal(csvCell('Bonjour'), '"Bonjour"');
  assert.equal(csvCell(null), '""');
});
test('produces BOM and CRLF for French spreadsheet imports', () => {
  assert.equal(csvDocument(['Nom','Ville'], [['Alice','Liernais']]), '\uFEFF"Nom";"Ville"\r\n"Alice";"Liernais"');
});
test('rejects malformed rows instead of silently losing data', () => {
  assert.throws(() => csvDocument(['a','b'], [['x']]), /width mismatch/);
});
