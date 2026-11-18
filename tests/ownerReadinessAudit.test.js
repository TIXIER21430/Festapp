import test from 'node:test';
import assert from 'node:assert/strict';
import {auditOwnerReadiness} from '../src/lib/ownerReadinessAudit.js';

test('identifies practical gaps without claiming the user reviewed anything',()=>{
 const before={events:[{id:'template',values:['Fête des voisins','','']}],shopping:[{id:'s',values:['Pain','','']}],tasks:[{id:'t',values:['Faire les affiches','','']}],contacts:[],stock:[],shifts:[],recipes:[],ecocups:[]};
 const snapshot=structuredClone(before);
 const audit=auditOwnerReadiness(before,{ecocups:{opening:''}});
 assert.deepEqual(before,snapshot);
 assert.deepEqual(audit.issues.map(i=>i.id),['contacts-empty','shifts-empty','stock-empty','recipes-empty','ecocups-opening','events-date','shopping-quantity','tasks-owner']);
 assert.equal(audit.count,8);
 assert.match(audit.issues.find(i=>i.id==='events-date').detail,/modèles annuels/);
 assert.equal(audit.issues.some(i=>'checked'in i),false);
});

test('does not invent missing fields on complete records and ecocup settings',()=>{
 const data={events:[{values:['Noël','2026-12-06','Liernais']}],contacts:[{values:['Camille','Bénévole','']}],shifts:[{values:['Camille','10h-12h','Accueil']}],stock:[{values:['Assiettes','50','10']}],recipes:[{values:['Gaufres','Farine','Mélanger']}],ecocups:[],shopping:[{values:['Pain','20','à commander']}],tasks:[{values:['Prévoir affiches','Camille','demain']}]};
 assert.deepEqual(auditOwnerReadiness(data,{ecocups:{opening:'250'}}),{issues:[],count:0});
});

test('empty or malformed arrays are safe and filled records have precise suggestions',()=>{
 const audit=auditOwnerReadiness({stock:[{values:['Bouteille','','']}],shifts:[{values:['Jo','matin','']}]});
 assert.match(audit.issues.find(i=>i.id==='stock-quantity').detail,/1 fiche/);
 assert.match(audit.issues.find(i=>i.id==='shifts-incomplete').detail,/1 champ/);
 assert.equal(auditOwnerReadiness(null).count>=1,true);
});
