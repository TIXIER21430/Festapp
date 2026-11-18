import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER_MODULES,fingerprintOwnerModule,parseOwnerReviews,summarizeOwnerReviews} from '../src/lib/ownerSetup.js';

test('readiness never mistakes existing rows for manual verification',()=>{
 const summary=summarizeOwnerReviews({events:[{id:'x'}],tasks:[{id:'t'}]},{});
 assert.equal(summary.total,OWNER_MODULES.length);
 assert.equal(summary.checked,0);
 assert.equal(summary.items.find(x=>x.key==='events').count,1);
});

test('review parsing ignores malformed, unknown, and unchecked entries',()=>{
 const fingerprint=fingerprintOwnerModule({},'events');
 const raw=JSON.stringify({events:{checked:true,at:'2026-11-18T10:00:00.000Z',fingerprint},tasks:{checked:false,at:'2026-11-18T10:00:00.000Z'},unknown:{checked:true,at:'2026-11-18T10:00:00.000Z'},finance:{checked:true,at:'garbage'}});
 const review=parseOwnerReviews(raw);
 assert.deepEqual(Object.keys(review),['events']);
 assert.deepEqual(parseOwnerReviews('{broken'),{});
 assert.equal(summarizeOwnerReviews({},review).checked,1);
});

test('a later change in a checked module requires another manual verification',()=>{
 const data={events:[{id:'a',values:['Noël','05/12','Liernais']}]};
 const reviews={events:{checked:true,at:'2026-11-18T10:00:00Z',fingerprint:fingerprintOwnerModule(data,'events')}};
 assert.equal(summarizeOwnerReviews(data,reviews).checked,1);
 const changed={events:[{id:'a',values:['Noël','06/12','Liernais']}]};
 const summary=summarizeOwnerReviews(changed,reviews);
 assert.equal(summary.checked,0);
 assert.equal(summary.items.find(item=>item.key==='events').needsRecheck,true);
});

test('changing the ecocup stock opening or alert threshold invalidates a review',()=>{
 const data={ecocups:[]};
 const before={ecocups:{opening:'100',threshold:'10'}};
 const reviews={ecocups:{checked:true,at:'2026-11-18T10:00:00Z',fingerprint:fingerprintOwnerModule(data,'ecocups',before)}};
 assert.equal(summarizeOwnerReviews(data,reviews,before).checked,1);
 assert.equal(summarizeOwnerReviews(data,reviews,{ecocups:{opening:'90',threshold:'10'}}).checked,0);
});
