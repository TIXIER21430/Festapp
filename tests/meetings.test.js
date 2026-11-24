import test from 'node:test';
import assert from 'node:assert/strict';
import {newMeeting,saveMeetingDraft,readMeeting,planMeeting,finalizeMeeting,classifyMeetingNotes} from '../src/lib/meetings.js';
import {makeTestSyncPayload} from '../src/lib/testSyncPayload.js';
import {makeMeetingDocx} from '../src/lib/reportDocx.js';
const data={events:[{id:'future',values:['Noël','','']},{id:'past',values:['Halloween','','']}],tasks:[{id:'old',eventId:'future',phase:'Avant',done:true,values:['Réserver le groupe','','']}]};
const draft=()=>{const m=newMeeting('one','2026-11-24');return {...m,eventId:'future',previousId:'past',nextDate:'2027-01-10',notes:{...m.notes,before:'Réserver le groupe\nCommander le pain',during:'Installer la buvette',after:'Ranger',shopping:'Gaz ; 4',equipment:'Rallonges ; 2',general:'Préparer le calendrier',positive:'Bonne ambiance',negative:'Manque de bénévoles',used:'80 kg de frites',shifts:'Alice ; 10:00-12:00 ; Bar',free:'Discussion à conserver'}};};
test('meeting draft persists in existing private sync and backup format without distributing',()=>{
 const m=draft();const saved=saveMeetingDraft(data,m);
 assert.deepEqual(readMeeting(makeTestSyncPayload({data:saved}).data.archives[0]),m);
 assert.equal(saved.tasks.length,1);
});
test('one validation distributes by event and stage, keeps completed tasks and archives free notes',()=>{
 const saved=saveMeetingDraft(data,draft());let n=0;const r=finalizeMeeting(saved,'meeting-one',()=>String(++n));
 assert.equal(r.duplicates,1);assert.equal(r.data.tasks[0].done,true);
 assert.deepEqual(r.data.tasks.filter(x=>x.eventId==='future').map(x=>x.phase),['Avant','Avant','Pendant','Après']);
 assert.equal(r.data.shopping[0].eventId,'future');assert.equal(r.data.shopping[1].eventId,undefined);
 assert.ok(r.data.feedback.every(x=>x.eventId==='past'));
 assert.equal(r.data.shifts[0].eventId,'future');
 assert.equal(readMeeting(r.data.archives[0]).notes.free,'Discussion à conserver');
 assert.throws(()=>finalizeMeeting(r.data,'meeting-one',()=>String(++n)),/déjà validée/);
 assert.equal(saved.tasks.length,1);
});
test('missing event and invalid or conflicting shifts block all distribution',()=>{
 const m=draft();m.eventId='';assert.ok(planMeeting(data,m).errors.length);
 const saved=saveMeetingDraft(data,m);assert.throws(()=>finalizeMeeting(saved,m.id,()=> 'new'));
 const other=draft();other.notes.shifts+=' \nAlice ; 11:00-13:00 ; Cuisine';assert.ok(planMeeting(data,other).errors.some(e=>e.includes('conflit')));
});
test('free notes are only classified with explicit headings, unknown text preserved',()=>{
 const m=draft();m.notes.free='Avant : Imprimer les affiches\nPoint faible : Trop peu de tables\nDiscuter du budget';
 const r=classifyMeetingNotes(m);assert.equal(r.count,2);assert.match(r.meeting.notes.before,/Imprimer/);assert.equal(r.meeting.notes.free,'Discuter du budget');
});
test('meeting Word report is a real docx ZIP',async()=>{
 const blob=await makeMeetingDocx({date:'2026-11-24',sections:[{label:'Avant',text:'Réserver & préparer'}]});
 assert.equal(blob.type,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
 assert.deepEqual([...new Uint8Array(await blob.slice(0,4).arrayBuffer())],[80,75,3,4]);
});
