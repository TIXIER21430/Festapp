import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectDemoTaskLinks } from '../src/lib/demoTaskLinks.js';

test('read-only inspection accepts deeply frozen demonstration records', () => {
  const events = Object.freeze([
    Object.freeze({ id: '2026', values: Object.freeze(['Carnaval']) }),
    Object.freeze({ id: '2027', values: Object.freeze(['Carnaval']) })
  ]);
  const tasks = Object.freeze([
    Object.freeze({ id: 't1', values: Object.freeze(['Préparer les chars']), manifestationId: '2027', manifestation: 'Carnaval' }),
    Object.freeze({ id: 't2', values: Object.freeze(['Réserver la salle']), manifestation: 'Carnaval' })
  ]);
  const before = JSON.stringify({ events, tasks });
  const result = inspectDemoTaskLinks(events, tasks);
  assert.equal(result.linked, 1);
  assert.equal(result.ambiguous, 1);
  assert.deepEqual(result.details.map(({ taskId, eventId }) => [taskId, eventId]), [['t1', '2027'], ['t2', null]]);
  assert.equal(JSON.stringify({ events, tasks }), before);
});

test('inspection never auto-assigns a task when an event name is duplicated', () => {
  const events = [
    { id: 'a', values: ['Marché de Noël'] },
    { id: 'b', values: ['Marché de Noël'] }
  ];
  const tasks = [{ id: 't', values: ['Installer les stands'], manifestation: 'Marché de Noël' }];
  const first = inspectDemoTaskLinks(events, tasks);
  const second = inspectDemoTaskLinks(events, tasks);
  assert.equal(first.suggested, 0);
  assert.equal(first.ambiguous, 1);
  assert.deepEqual(second, first);
  assert.equal(tasks[0].manifestationId, undefined);
});
