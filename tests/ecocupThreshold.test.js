import test from 'node:test';
import assert from 'node:assert/strict';
import { ecocupStockStatus, validateEcocupThreshold } from '../src/lib/ecocupThreshold.js';

test('zero is an allowed threshold', () => assert.equal(validateEcocupThreshold(0), 0));
test('alert at and below threshold', () => {
  assert.deepEqual(ecocupStockStatus(100, 100), { stock: 100, threshold: 100, alert: true, shortage: 0 });
  assert.equal(ecocupStockStatus(101, 100).alert, false);
  assert.equal(ecocupStockStatus(75, 100).shortage, 25);
});
test('reject invalid thresholds and stocks without coercion', () => {
  for (const value of [-1, 1.5, NaN, Infinity, '100', null, undefined, Number.MAX_SAFE_INTEGER + 1]) {
    assert.throws(() => validateEcocupThreshold(value), RangeError);
    assert.throws(() => ecocupStockStatus(value, 100), RangeError);
  }
});
test('result cannot be mutated', () => {
  const result = ecocupStockStatus(10, 20);
  assert.equal(Object.isFrozen(result), true);
  assert.throws(() => { result.stock = 1000; }, TypeError);
});
