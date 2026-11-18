import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER_MODULES,parseOwnerReviews,summarizeOwnerReviews} from '../src/lib/ownerSetup.js';

test('readiness never mistakes existing rows for manual verification',()=>{
 const summary=summarizeOwnerReviews({events:[{id:'x'}],tasks:[{id:'t'}]},{});
 assert.equal(summary.total,OWNER_MODULES.length);
 assert.equal(summary.checked,0);
 assert.equal(summary.items.find(x=>x.key==='events').count,1);
});

test('review parsing ignores malformed, unknown, and unchecked entries',()=>{
 const raw=JSON.stringify({events:{checked:true,at:'2026-11-18T10:00:00.000Z'},tasks:{checked:false,at:'2026-11-18T10:00:00.000Z'},unknown:{checked:true,at:'2026-11-18T10:00:00.000Z'},finance:{checked:true,at:'garbage'}});
 const review=parseOwnerReviews(raw);
 assert.deepEqual(Object.keys(review),['events']);
 assert.deepEqual(parseOwnerReviews('{broken'),{});
 assert.equal(summarizeOwnerReviews({},review).checked,1);
});
