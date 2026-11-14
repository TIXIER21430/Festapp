import test from 'node:test';
import assert from 'node:assert/strict';
import { preflightLinkedSharedImport } from '../src/lib/sharedLinkedImportPreflight.js';

const opts = { environment: 'test' };
test('accepts tasks referring to an existing event', () => {
  const result = preflightLinkedSharedImport({taches:[{id:'t1',event_id:'e1'}]}, {manifestations:[{id:'e1'}]}, opts);
  assert.equal(result.ok,true);
});
test('accepts an event and its tasks imported together', () => {
  const result = preflightLinkedSharedImport({manifestations:[{id:'e2'}],taches:[{id:'t2',event_id:'e2'}]}, {}, opts);
  assert.equal(result.ok,true);
});
test('rejects orphan tasks without exposing partial additions', () => {
  const result = preflightLinkedSharedImport({manifestations:[{id:'e2'}],taches:[{id:'t2',event_id:'missing'}]}, {}, opts);
  assert.equal(result.ok,false);
  assert.deepEqual(result.additions,{});
});
test('rejects existing orphan tasks, preventing unsafe imports', () => {
  const result = preflightLinkedSharedImport({}, {taches:[{id:'t1',event_id:'lost'}]}, opts);
  assert.equal(result.ok,false);
});
test('production environment is never accepted', () => {
  const result = preflightLinkedSharedImport({manifestations:[{id:'e1'}]}, {}, {environment:'production'});
  assert.equal(result.ok,false);
});
test('does not mutate input', () => {
  const incoming={manifestations:[{id:'e1'}],taches:[{id:'t1',event_id:'e1'}]};
  const before=JSON.stringify(incoming);
  preflightLinkedSharedImport(incoming,{},opts);
  assert.equal(JSON.stringify(incoming),before);
});
