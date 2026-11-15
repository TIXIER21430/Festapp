import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeEcocups } from '../src/lib/ecocupInventory.js';

test('tracks purchases, checkouts, returns and losses without mutating inputs', () => {
  const movements = [
    { id: 'a', kind: 'purchase', quantity: 50 },
    { id: 'b', kind: 'checkout', quantity: 70 },
    { id: 'c', kind: 'return', quantity: 30 },
    { id: 'd', kind: 'loss', quantity: 5 }
  ];
  const before = JSON.stringify(movements);
  assert.deepEqual(summarizeEcocups({ opening: 100, threshold: 110, movements }), {
    available: 105, threshold: 110, lowStock: true, movementCount: 4
  });
  assert.equal(JSON.stringify(movements), before);
});
test('alerts at exact threshold and clears above it', () => {
  assert.equal(summarizeEcocups({ opening: 20, threshold: 20 }).lowStock, true);
  assert.equal(summarizeEcocups({ opening: 21, threshold: 20 }).lowStock, false);
});
test('rejects duplicate IDs, negative balance and malformed movements', () => {
  assert.throws(() => summarizeEcocups({ opening: 2, movements: [{ id: 'a', kind: 'checkout', quantity: 3 }] }), /balance/);
  assert.throws(() => summarizeEcocups({ movements: [{ id: 'a', kind: 'purchase', quantity: 1 }, { id: 'a', kind: 'return', quantity: 1 }] }), /duplicate/);
  assert.throws(() => summarizeEcocups({ movements: [{ id: 'x', kind: 'purchase', quantity: 1.5 }] }), /integer/);
  assert.throws(() => summarizeEcocups({ movements: [{ id: 'x', kind: 'unknown', quantity: 1 }] }), /Unknown/);
});
test('requires audit reason for signed stock corrections', () => {
  assert.throws(() => summarizeEcocups({ opening: 10, movements: [{ id: 'x', kind: 'adjustment', quantity: -2 }] }), /reason/);
  assert.equal(summarizeEcocups({ opening: 10, movements: [{ id: 'x', kind: 'adjustment', quantity: -2, reason: 'Inventaire' }] }).available, 8);
});
