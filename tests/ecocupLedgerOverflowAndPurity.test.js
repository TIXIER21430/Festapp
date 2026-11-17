import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeEcocups } from '../src/lib/ecocupInventory.js';

test('Ecocup ledger rejects overflow from accumulated valid movements', () => {
  assert.throws(() => summarizeEcocups({
    opening: Number.MAX_SAFE_INTEGER,
    threshold: 0,
    movements: [{ id: 'achat-supplementaire', kind: 'purchase', quantity: 1 }]
  }), /balance/);
  assert.throws(() => summarizeEcocups({
    opening: 0,
    threshold: 0,
    movements: [
      { id: 'achat-initial', kind: 'purchase', quantity: Number.MAX_SAFE_INTEGER },
      { id: 'retour', kind: 'return', quantity: 1 }
    ]
  }), /balance/);
});

test('Ecocup summary is pure and leaves frozen source ledger untouched', () => {
  const first = Object.freeze({ id: 'achat', kind: 'purchase', quantity: 12 });
  const second = Object.freeze({ id: 'sortie', kind: 'checkout', quantity: 3 });
  const movements = Object.freeze([first, second]);
  const input = Object.freeze({ opening: 2, threshold: 4, movements });
  assert.deepEqual(summarizeEcocups(input), {
    available: 11, threshold: 4, lowStock: false, movementCount: 2
  });
  assert.deepEqual(movements, [first, second]);
  assert.equal(first.quantity, 12);
  assert.equal(second.quantity, 3);
});
