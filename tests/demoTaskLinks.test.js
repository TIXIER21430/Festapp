import test from 'node:test';
import assert from 'node:assert/strict';
import { inspectDemoTaskLinks } from '../src/lib/demoTaskLinks.js';

test('inspects the existing demo record shape without mutation', () => {
  const events = [{ id: 'seed-0', values: ['Marché de Noël', '', ''] }];
  const tasks = [{ id: 't1', values: ['Préparer la buvette', '', ''], manifestation: 'Marché de Noël' }];
  const before = JSON.stringify({ events, tasks });
  assert.deepEqual(inspectDemoTaskLinks(events, tasks), {
    linked: 0, suggested: 1, ambiguous: 0, missing: 0,
    details: [{ taskId: 't1', status: 'suggested', eventId: 'seed-0' }]
  });
  assert.equal(JSON.stringify({ events, tasks }), before);
});

test('flags ambiguous duplicate names instead of choosing an event', () => {
  const events = [{ id: 'a', values: ['Bal'] }, { id: 'b', values: ['Bal'] }];
  const tasks = [{ id: 't', values: ['Installer'], manifestation: 'Bal' }];
  const result = inspectDemoTaskLinks(events, tasks);
  assert.equal(result.ambiguous, 1);
  assert.equal(result.details[0].eventId, null);
});

test('keeps explicit event IDs authoritative after a rename', () => {
  const events = [{ id: 'a', values: ['Nouveau nom'] }];
  const tasks = [{ id: 't', values: ['Installer'], manifestationId: 'a', manifestation: 'Ancien nom' }];
  assert.equal(inspectDemoTaskLinks(events, tasks).linked, 1);
});

test('reports missing links and rejects malformed records without writes', () => {
  assert.equal(inspectDemoTaskLinks([], [{ id: 't', values: ['Installer'] }]).missing, 1);
  assert.throws(() => inspectDemoTaskLinks([{ id: 'x', values: null }], []), /Invalid demo event/);
  assert.throws(() => inspectDemoTaskLinks([], [{ id: 'x' }]), /Invalid demo task/);
});
