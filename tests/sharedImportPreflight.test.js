import test from 'node:test';
import assert from 'node:assert/strict';
import { preflightSharedImport, MVP_COLLECTIONS } from '../src/lib/sharedImportPreflight.js';

test('rejects production and unspecified environments', () => {
  for (const environment of [undefined, 'production']) {
    assert.equal(preflightSharedImport({}, {}, { environment }).ok, false);
  }
});
test('accepts independent additions in test without changing originals', () => {
  const incoming = { benevoles: [{ id: 'b2', nom: 'B' }] };
  const existing = { benevoles: [{ id: 'b1', nom: 'A' }] };
  const before = JSON.stringify({ incoming, existing });
  const result = preflightSharedImport(incoming, existing, { environment: 'test' });
  assert.equal(result.ok, true);
  assert.equal(result.additions.benevoles.length, 1);
  result.additions.benevoles[0].nom = 'Changed';
  assert.equal(JSON.stringify({ incoming, existing }), before);
  assert.equal(Object.keys(result.additions).length, MVP_COLLECTIONS.length);
});
test('rejects conflicts atomically across categories', () => {
  const result = preflightSharedImport({ benevoles: [{ id: 'a' }], groupes: [{ id: 'g' }] }, { benevoles: [{ id: 'a' }] }, { environment: 'test' });
  assert.equal(result.ok, false);
  assert.deepEqual(result.additions, {});
});
test('rejects duplicates inside the incoming batch', () => {
  assert.equal(preflightSharedImport({ ecocups: [{ id: 'x' }, { id: 'x' }] }, {}, { environment: 'test' }).ok, false);
});
test('rejects invalid shapes and unknown collections', () => {
  assert.equal(preflightSharedImport(null, {}, { environment: 'test' }).ok, false);
  assert.equal(preflightSharedImport({ secret: [] }, {}, { environment: 'test' }).ok, false);
  assert.equal(preflightSharedImport({ taches: 'bad' }, {}, { environment: 'test' }).ok, false);
});
test('rejects excessive combined collection size', () => {
  const target = Array.from({ length: 10000 }, (_, i) => ({ id: String(i) }));
  assert.equal(preflightSharedImport({ manifestations: [{ id: 'extra' }] }, { manifestations: target }, { environment: 'test' }).ok, false);
});
