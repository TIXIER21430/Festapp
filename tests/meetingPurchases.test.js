import test from 'node:test';
import assert from 'node:assert/strict';
import {parseMeetingNeed,planMeetingPurchases} from '../src/lib/meetingPurchases.js';
import {newMeeting,saveMeetingDraft,finalizeMeeting} from '../src/lib/meetings.js';
const row=(id,name,qty,status='',eventId)=>({id,values:[name,qty,status],...(eventId?{eventId}:{})});
const stock=[row('s1','Coca','12'),row('s2','Frites','5'),row('s3','Andouillettes','0'),row('s4','Vin rouge cubi 3 L','1'),row('s5','Vin rouge cubi 5 L','2'),row('s6','Oignons',''),row('s7','Lait','1')];
test('natural meeting notes resolve stock names, aliases and units',()=>{
 for(const [line,name,needed] of [['48 Coca','Coca',48],['Il faut 25 kg de frites','Frites',25],['60 andouillette','Andouillettes',60],['Coca ; 48','Coca',48],['Coca 48','Coca',48],['2 cubi rouge 5l','Vin rouge cubi 5 L',2],['2 cubis de vin rouge 5 L','Vin rouge cubi 5 L',2],['500 g de frites','Frites',.5],['Lait ; 150 cl','Lait',1.5],['48 bouteilles de Coca','Coca',48]]){
  const p=parseMeetingNeed(line,stock);assert.equal(p.name,name,line);assert.equal(p.needed,needed,line);
 }
 assert.throws(()=>parseMeetingNeed('2 vin rouge',stock),/Précise/);
 assert.throws(()=>parseMeetingNeed('2 packs de Coca',stock),/Unité/);
 assert.throws(()=>parseMeetingNeed('Coca',stock),/quantité/);
});
test('deduct stock and current event purchases, never double count transferred purchases or other events',()=>{
 const data={stock,shopping:[{...row('a','Coca','10','À acheter','event'),supplier:'Adagri'},row('b','Coca','4','Acheté','event'),row('c','Coca','12','Transféré au stock · 2026-11-24','event'),row('d','Coca','99','À acheter','other')]};
 const p=planMeetingPurchases(data,'event',['48 Coca','25 kg de frites','60 andouillettes','1 vin rouge cubi 5 L','2 oignons']);
 assert.deepEqual(p.errors,[]);
 const coca=p.summary.find(r=>r.name==='Coca');assert.equal(coca.additional,22);assert.equal(coca.planned,14);
 const update=p.rows.find(r=>r.replaceId==='a');assert.equal(update.row.values[1],'32');assert.equal(update.row.supplier,'Adagri');
 assert.equal(p.summary.find(r=>r.name==='Frites').additional,20);
 assert.equal(p.summary.find(r=>r.name==='Vin rouge cubi 5 L').additional,0);
 assert.equal(p.summary.find(r=>r.name==='Oignons').available,null);
 assert.equal(data.stock[0].values[1],'12');
});
test('duplicate needs are not silently added; ambiguous or inconsistent lines block validation',()=>{
 const p=planMeetingPurchases({stock},'event',['48 Coca','Coca ; 48','24 Coca','2 vin rouge']);
 assert.equal(p.duplicates.length,1);assert.equal(p.errors.length,2);
});
test('finalizing meeting adds only missing quantities, updates existing row, preserves stock and history',()=>{
 const data={events:[row('event','Noël','')],stock,shopping:[row('a','Coca','10','À acheter','event'),row('old','Frites','5','Transféré au stock · 2026-11-24','event')]};
 const m=newMeeting('needs','2026-11-24');m.eventId='event';m.notes.shopping='48 Coca\n25 kg de frites\n1 vin rouge cubi 5 L';
 const saved=saveMeetingDraft(data,m);let n=0;
 const result=finalizeMeeting(saved,m.id,()=>String(++n));
 assert.equal(result.data.shopping.find(r=>r.id==='a').values[1],'36');
 assert.equal(result.data.shopping.find(r=>r.id==='old').values[2],'Transféré au stock · 2026-11-24');
 assert.equal(result.data.shopping.find(r=>r.id!=='old'&&r.values[0]==='Frites').values[1],'20');
 assert.equal(result.data.shopping.length,3);assert.deepEqual(result.data.stock,stock);
 assert.throws(()=>finalizeMeeting(result.data,m.id,()=>String(++n)),/déjà validée/);
});

test('ordinary dictation supports multiple explicit quantities and preserves decimal commas',()=>{
 const p=planMeetingPurchases({stock},'event',['Il faut 48 Coca, 25,5 kg de frites et 60 andouillettes']);
 assert.deepEqual(p.errors,[]);assert.equal(p.summary.length,3);
 assert.equal(p.summary.find(r=>r.name==='Frites').additional,20.5);
 assert.ok(planMeetingPurchases({stock},'event',['48 Coca et Orangina']).errors.length);
});
