import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectDemoTaskLinks } from '../src/lib/demoTaskLinks.js';

// A failed preflight must not partially migrate legacy demo records.
test('rejects a malformed later task without changing any earlier links', () => {
  const events = Object.freeze([
    Object.freeze({ id: 'event-2026', values: Object.freeze(['Carnaval']) })
  ]);
  const tasks = Object.freeze([
    Object.freeze({ id: 'ok', values: Object.freeze(['Préparer les affiches']), manifestation: 'Carnaval' }),
    Object.freeze({ id: 'bad', values: null })
  ]);
  assert.throws(() => inspectDemoTaskLinks(events, tasks), /Invalid demo task record/);
  assert.equal(tasks[0].manifestationId, undefined);
  assert.equal(tasks[0].manifestation, 'Carnaval');
});

test('does not silently attach a task to an event when no explicit link or name exists', () => {
  const events = Object.freeze([Object.freeze({ id: 'event-2026', values: Object.freeze(['Carnaval']) })]);
  const tasks = Object.freeze([Object.freeze({ id: 'unassigned', values: Object.freeze(['Ranger le matériel']) })]);
  const result = inspectDemoTaskLinks(events, tasks);
  assert.equal(result.linked, 0);
  assert.equal(result.suggested, 0);
  assert.equal(result.missing, 1);
  assert.deepEqual(result.details, [{ taskId: 'unassigned', status: 'missing', eventId: null }]);
});
