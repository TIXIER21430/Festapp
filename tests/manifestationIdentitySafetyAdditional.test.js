import test from 'node:test';
import assert from 'node:assert/strict';
import { indexManifestations, reconcileManifestationTasks } from '../src/lib/manifestationIdentity.js';

test('legacy tasks with the same name across years remain ambiguous', () => {
  const events = Object.freeze([
    Object.freeze({ id: 'carnaval-2026', nom: 'Carnaval' }),
    Object.freeze({ id: 'carnaval-2027', nom: ' Carnaval ' }),
  ]);
  const tasks = Object.freeze([Object.freeze({ manifestation: 'Carnaval', titre: 'Installer les tables' })]);
  const result = reconcileManifestationTasks(events, tasks);
  assert.equal(result[0].status, 'ambiguous');
  assert.equal(result[0].eventId, null);
  assert.equal(result[0].task, tasks[0]);
  assert.equal(tasks[0].manifestationId, undefined);
});

test('explicit ID takes precedence over a conflicting legacy event name', () => {
  const events = [{ id: 'fete-2026', nom: 'Fête' }, { id: 'fete-2027', nom: 'Fête' }];
  const task = Object.freeze({ manifestationId: 'fete-2027', manifestation: 'Fête' });
  const [entry] = reconcileManifestationTasks(events, [task]);
  assert.equal(entry.status, 'linked');
  assert.equal(entry.eventId, 'fete-2027');
  assert.equal(entry.task, task);
});

test('prototype-like display names do not produce accidental matches', () => {
  const events = [{ id: 'event-1', nom: '__proto__' }, { id: 'event-2', nom: 'constructor' }];
  const result = reconcileManifestationTasks(events, [
    { manifestation: '__proto__' },
    { manifestation: 'constructor' },
    { manifestation: 'toString' },
  ]);
  assert.deepEqual(result.map(({ status, eventId }) => [status, eventId]), [
    ['suggested', 'event-1'],
    ['suggested', 'event-2'],
    ['missing', null],
  ]);
});

test('index rejects malformed event entries without mutating input', () => {
  const events = Object.freeze([Object.freeze({ id: 'ok' }), null]);
  assert.throws(() => indexManifestations(events), /Invalid manifestation ID/);
  assert.equal(events.length, 2);
});
