import test from 'node:test';
import assert from 'node:assert/strict';
import { previewEcocupImport } from '../src/lib/ecocupImportPreview.js';

test('calculates purchases, distributions and returns without mutating inputs', () => {
  const rows = Object.freeze([
    Object.freeze({ id: 'a', type: 'achat', quantity: 30 }),
    Object.freeze({ id: 'b', type: 'sortie', quantity: 12 }),
    Object.freeze({ id: 'c', type: 'retour', quantity: 4 })
  ]);
  assert.deepEqual(previewEcocupImport(rows, { initialStock: 10, threshold: 30 }), {
    accepted: true, count: 3, projectedStock: 32, lowStock: false,
    deltas: { achat: 30, sortie: -12, retour: 4, perte: 0, correction: 0 }, errors: []
  });
});
test('rejects duplicate existing or imported identifiers', () => {
  const result = previewEcocupImport([{ id: 'x', type: 'achat', quantity: 1 }, { id: 'x', type: 'achat', quantity: 2 }], { existingIds: ['x'] });
  assert.equal(result.accepted, false);
  assert.equal(result.projectedStock, null);
  assert.equal(result.errors.length, 2);
});
test('rejects a negative projected balance and never offers partial import', () => {
  const result = previewEcocupImport([{ id: 'x', type: 'sortie', quantity: 2 }], { initialStock: 1 });
  assert.equal(result.accepted, false);
  assert.equal(result.projectedStock, null);
});
test('requires manual review for corrections and rejects invalid quantities', () => {
  const result = previewEcocupImport([{ id: 'a', type: 'correction', quantity: 1 }, { id: 'b', type: 'achat', quantity: -1 }]);
  assert.deepEqual(result.errors.map(e => e.reason), ['correction-requires-manual-review', 'invalid-movement']);
});
test('alerts at threshold inclusively', () => {
  const result = previewEcocupImport([{ id: 'a', type: 'sortie', quantity: 1 }], { initialStock: 101, threshold: 100 });
  assert.equal(result.lowStock, true);
});
test('rejects unbounded input', () => {
  assert.throws(() => previewEcocupImport(Array(10001).fill(null)), TypeError);
});

test('normalizes whitespace in existing and incoming movement identifiers', () => {
  const result = previewEcocupImport([
    { id: ' x ', type: 'achat', quantity: 2 },
    { id: 'y', type: 'achat', quantity: 1 },
    { id: ' y ', type: 'retour', quantity: 1 }
  ], { existingIds: ['x'], initialStock: 10 });
  assert.equal(result.accepted, false);
  assert.deepEqual(result.errors.map(e => e.index), [0, 2]);
  assert.equal(result.projectedStock, null);
});
test('rejects malformed existing identifiers rather than silently bypassing duplicate checks', () => {
  assert.throws(() => previewEcocupImport([], { existingIds: [null] }), TypeError);
  assert.throws(() => previewEcocupImport([], { existingIds: ['  '] }), TypeError);
});
