import test from 'node:test';
import assert from 'node:assert/strict';
import {persistCompleteZipRestore} from '../src/lib/completeZipCommit.js';
import {DEMO_STORAGE_KEY} from '../src/lib/demoStorage.js';
import {ECOCUP_DEMO_SETTINGS_KEY} from '../src/lib/ecocupDemoSettings.js';

const plan={safe:true,nextData:{events:[{id:'a',values:['Fête','2026','Liernais']}]},nextNeeds:{},nextEcocups:{openingBalance:'25',alertThreshold:'10'},nextMenus:{},nextReviews:{}};
function storage(failKey){
 const items=new Map([[DEMO_STORAGE_KEY,'old-data']]);let failed=false;
 return {items,getItem(key){return items.has(key)?items.get(key):null;},setItem(key,value){if(key===failKey&&!failed){failed=true;throw new Error('storage full');}items.set(key,value);},removeItem(key){items.delete(key);}};
}

test('saves the validated ZIP plan, including ecocup settings',()=>{
 const s=storage();persistCompleteZipRestore(s,plan);
 assert.equal(JSON.parse(s.getItem(DEMO_STORAGE_KEY)).events.length,1);
 assert.equal(JSON.parse(s.getItem(ECOCUP_DEMO_SETTINGS_KEY)).openingBalance,'25');
});

test('rolls back all localStorage keys on a quota error',()=>{
 const s=storage(ECOCUP_DEMO_SETTINGS_KEY),before=new Map(s.items);
 assert.throws(()=>persistCompleteZipRestore(s,plan),/conservées/);
 assert.deepEqual(s.items,before);
});

test('does not commit an unapproved plan',()=>{
 const s=storage();assert.throws(()=>persistCompleteZipRestore(s,{...plan,safe:false}),/conflits/);
 assert.equal(s.getItem(DEMO_STORAGE_KEY),'old-data');
});
