import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeEcocups } from '../src/lib/ecocupInventory.js';

test('rejects stock overflow instead of rounding inventory quantities', () => {
  assert.throws(() => summarizeEcocups({
    opening: Number.MAX_SAFE_INTEGER,
    movements: [{ id: 'achat-1', kind: 'purchase', quantity: 1 }]
  }), /balance/);
  assert.throws(() => summarizeEcocups({
    opening: 0,
    threshold: Number.MAX_SAFE_INTEGER + 1
  }), /safe integer/);
});

test('a failed later movement leaves the original ledger untouched', () => {
  const movements = Object.freeze([
    Object.freeze({ id: 'achat-1', kind: 'purchase', quantity: 10 }),
    Object.freeze({ id: 'sortie-1', kind: 'checkout', quantity: 11 })
  ]);
  assert.throws(() => summarizeEcocups({ opening: 0, movements }), /balance/);
  assert.deepEqual(movements, [
    { id: 'achat-1', kind: 'purchase', quantity: 10 },
    { id: 'sortie-1', kind: 'checkout', quantity: 11 }
  ]);
});
