import test from 'node:test';
import assert from 'node:assert/strict';
import {makeTestSyncPayload,readTestSyncPayload,sameTestPayload,testSyncRecordCount} from '../src/lib/testSyncPayload.js';
import {persistCloudSnapshot} from '../src/lib/supabaseCloudImport.js';
import {DEMO_STORAGE_KEY} from '../src/lib/demoStorage.js';
import {VOLUNTEER_NEEDS_KEY} from '../src/lib/volunteerNeeds.js';
import {ECOCUP_DEMO_SETTINGS_KEY} from '../src/lib/ecocupDemoSettings.js';
import {TILL_CONFIG_KEY} from '../src/lib/tillConfig.js';

const row={id:'n1',eventId:'noel',values:['Mettre la boisson au frais','Joss','2026-12-04'],done:true,phase:'Avant'};
const payload=()=>makeTestSyncPayload({data:{tasks:[row]},volunteerNeeds:{noel:{'🍹 Bar':3}},ecocupSettings:{openingBalance:'125',alertThreshold:'25'},tillConfig:{'Marché de Noël':[{id:'vin-chaud',priceCents:350}]}});
test('shared TEST snapshot keeps event links, checks, ecocups, staffing and menus',()=>{
 const result=payload();
 assert.deepEqual(result.data.tasks,[row]);
 assert.equal(result.volunteerNeeds.noel['🍹 Bar'],3);
 assert.equal(result.ecocupSettings.openingBalance,'125');
 assert.equal(result.tillConfig['Marché de Noël'][0].priceCents,350);
 assert.equal(testSyncRecordCount(result),1);
 assert.equal(sameTestPayload(result,{tillConfig:result.tillConfig,data:result.data,ecocupSettings:result.ecocupSettings,volunteerNeeds:result.volunteerNeeds}),true);
 assert.equal(sameTestPayload(result,{...result,ecocupSettings:{openingBalance:'124',alertThreshold:'25'}}),false);
});
test('old snapshots remain readable and invalid cloud values are rejected',()=>{
 const old=readTestSyncPayload({data:{events:[]},volunteerNeeds:{}});
 assert.deepEqual(old.tillConfig,{});
 assert.equal(old.ecocupSettings.alertThreshold,'100');
 assert.throws(()=>readTestSyncPayload({...payload(),ecocupSettings:{openingBalance:'oops',alertThreshold:'1'}}));
 assert.throws(()=>readTestSyncPayload({...payload(),tillConfig:{Bad:[{id:'unknown',priceCents:1}]}}));
});
test('cloud restore writes all local stores and leaves unrelated original files untouched',()=>{
 const map=new Map([['photo-original','keep']]);
 const storage={getItem:key=>map.get(key)??null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};
 const clean=persistCloudSnapshot(storage,payload());
 assert.equal(JSON.parse(map.get(DEMO_STORAGE_KEY)).tasks[0].done,true);
 assert.equal(JSON.parse(map.get(VOLUNTEER_NEEDS_KEY)).noel['🍹 Bar'],3);
 assert.equal(JSON.parse(map.get(ECOCUP_DEMO_SETTINGS_KEY)).openingBalance,'125');
 assert.equal(JSON.parse(map.get(TILL_CONFIG_KEY))['Marché de Noël'][0].priceCents,350);
 assert.equal(map.get('photo-original'),'keep');assert.equal(clean.data.tasks.length,1);
});
test('failed local cloud restore rolls back all keys without partial overwrite',()=>{
 const map=new Map([[DEMO_STORAGE_KEY,'original'],[VOLUNTEER_NEEDS_KEY,'original-needs']]);
 let fail=true;
 const storage={getItem:key=>map.get(key)??null,setItem:(k,v)=>{if(k===TILL_CONFIG_KEY&&fail){fail=false;throw new Error('full');}map.set(k,v)},removeItem:k=>map.delete(k)};
 assert.throws(()=>persistCloudSnapshot(storage,payload()),/conservées/);
 assert.equal(map.get(DEMO_STORAGE_KEY),'original');
 assert.equal(map.get(VOLUNTEER_NEEDS_KEY),'original-needs');
 assert.equal(map.has(ECOCUP_DEMO_SETTINGS_KEY),false);
});
