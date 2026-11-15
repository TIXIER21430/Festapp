import test from 'node:test';
import assert from 'node:assert/strict';
import { validateManifestationId, indexManifestations, reconcileManifestationTasks } from '../src/lib/manifestationIdentity.js';

test('validates stable IDs without depending on display names', () => {
  assert.equal(validateManifestationId('noel-2027'), true);
  assert.equal(validateManifestationId('../unsafe'), false);
  assert.equal(validateManifestationId(''), false);
});
test('rejects duplicate IDs without changing input', () => {
  const events = [{ id: 'a', nom: 'Marché' }, { id: 'a', nom: 'Fête' }];
  assert.throws(() => indexManifestations(events), /Duplicate/);
  assert.equal(events.length, 2);
});
test('does not silently relink ambiguous legacy names', () => {
  const events = [{ id: 'a', nom: 'Marché' }, { id: 'b', nom: 'Marché' }];
  const tasks = [{ manifestation: 'Marché', titre: 'Buvette' }];
  const result = reconcileManifestationTasks(events, tasks);
  assert.equal(result[0].status, 'ambiguous');
  assert.equal(result[0].eventId, null);
  assert.equal(tasks[0].manifestationId, undefined);
});
test('suggests unambiguous legacy match but does not mutate task', () => {
  const task = { manifestation: 'Noël', titre: 'Installer' };
  const result = reconcileManifestationTasks([{ id: 'noel-2027', nom: 'Noël' }], [task]);
  assert.equal(result[0].status, 'suggested');
  assert.equal(result[0].eventId, 'noel-2027');
  assert.deepEqual(task, { manifestation: 'Noël', titre: 'Installer' });
});
test('explicit unknown ID is missing even if name matches', () => {
  const result = reconcileManifestationTasks([{ id: 'a', nom: 'Noël' }], [{ manifestationId: 'old', manifestation: 'Noël' }]);
  assert.equal(result[0].status, 'missing');
});
