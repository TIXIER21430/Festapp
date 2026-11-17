import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeEcocups } from '../src/lib/ecocupInventory.js';

test('the Ecocup alert triggers at the threshold, not only below it', () => {
  const movements = Object.freeze([
    Object.freeze({ id: 'achat-1', kind: 'purchase', quantity: 10 }),
    Object.freeze({ id: 'sortie-1', kind: 'checkout', quantity: 5 })
  ]);
  assert.deepEqual(summarizeEcocups({ opening: 0, threshold: 5, movements }), {
    available: 5, threshold: 5, lowStock: true, movementCount: 2
  });
  assert.equal(summarizeEcocups({ opening: 0, threshold: 4, movements }).lowStock, false);
});

test('a justified negative stock adjustment cannot produce negative stock', () => {
  assert.deepEqual(summarizeEcocups({
    opening: 10, threshold: 8,
    movements: [{ id: 'inventaire-1', kind: 'adjustment', quantity: -2, reason: 'Comptage physique' }]
  }), { available: 8, threshold: 8, lowStock: true, movementCount: 1 });
  assert.throws(() => summarizeEcocups({
    opening: 1,
    movements: [{ id: 'inventaire-2', kind: 'adjustment', quantity: -2, reason: 'Comptage physique' }]
  }), /balance/);
  assert.throws(() => summarizeEcocups({
    opening: 10,
    movements: [{ id: 'inventaire-3', kind: 'adjustment', quantity: -1 }]
  }), /reason/);
});

test('equivalent Unicode movement IDs are rejected as duplicates', () => {
  assert.throws(() => summarizeEcocups({
    opening: 0,
    movements: [
      { id: 'retour-é', kind: 'return', quantity: 1 },
      { id: ' retour-e\u0301 ', kind: 'return', quantity: 1 }
    ]
  }), /duplicate/);
});
