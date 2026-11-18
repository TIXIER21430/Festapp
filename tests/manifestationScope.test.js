import test from 'node:test';
import assert from 'node:assert/strict';
import {recordsForManifestation,withRecordEventId} from '../src/lib/manifestationScope.js';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const hub=readFileSync(new URL('../src/ManifestationHub.jsx',import.meta.url),'utf8');

test('manifestation workspace shows only explicitly linked records and leaves general list intact',()=>{
 const rows=[
  {id:'noel',eventId:'noel-2026',values:['Pain','10','']},
  {id:'fanfare',eventId:'fanfare',values:['Verres','50','']},
  {id:'old',values:['Marché de Noël 2024','150','Bilan historique']},
  {id:'global',values:['Comité','','']}
 ];
 assert.deepEqual(recordsForManifestation(rows,'shopping','noel-2026'),[rows[0]]);
 assert.deepEqual(recordsForManifestation(rows,'finance','noel-2026'),[rows[0]]);
 assert.equal(recordsForManifestation(rows,'finance','').length,4);
 assert.equal(recordsForManifestation(rows,'contacts','noel-2026').length,4);
 assert.equal(rows[2].eventId,undefined);
 assert.throws(()=>recordsForManifestation(null,'shopping','noel'),TypeError);
});

test('edits keep or remove the explicit event link without leaving stale association',()=>{
 const source={id:'x',eventId:'noel-2026',done:true,phase:'Avant',values:['Afficher les tarifs','','']};
 const changed=withRecordEventId({...source,values:['Afficher les prix','','']},'fanfare');
 assert.equal(changed.eventId,'fanfare');
 assert.equal(changed.done,true);
 const general=withRecordEventId(source,'');
 assert.equal(Object.hasOwn(general,'eventId'),false);
 assert.equal(source.eventId,'noel-2026');
});

test('event tiles lead to a scoped form, list and export; bottom navigation remains general',()=>{
 assert.match(source,/setModuleScopeEventId\(eventId\)/);
 assert.match(source,/setRecordEventId\(moduleScopeEventId\)/);
 assert.match(source,/recordsForManifestation\(data\[tab\]\|\|\[\],tab,moduleScopeEventId\)\.filter/);
 assert.match(source,/const rows=tab==="contacts"[\s\S]*?recordsForManifestation\(data\[tab\]\|\|\[\],tab,moduleScopeEventId\)\.map/);
 assert.match(source,/scopeEvent\?<p className="festapp-module-attached"/);
 assert.match(source,/onClick=\{\(\)=>openModule\(tab\)\}/);
 assert.match(hub,/onOpenModule\(key,chosen.id\)/);
 assert.match(hub,/recordsForManifestation\(data\[key\]\|\|\[\],key,chosen.id\)/);
});

test('private review checklist is accessible in one tap from the colorful home',()=>{
 assert.match(hub,/className="festapp-owner-cta" type="button" onClick=\{onOwnerSetup\}/);
 assert.match(source,/function openOwnerSetup\(\)\{if\(advancedRef\.current\)advancedRef\.current\.open=true/);
 assert.match(source,/ref=\{advancedRef\}/);
 assert.match(source,/ref=\{ownerSetupRef\}><OwnerSetup/);
});
