import test from 'node:test';
import assert from 'node:assert/strict';
import {createCombinedDemoBackup} from '../src/lib/combinedDemoBackup.js';
import {makeCompleteBackupZip} from '../src/lib/photoZip.js';
import {readCompleteBackupZip,planCompleteZipRestore} from '../src/lib/completeZipRestore.js';
import {PHOTO_CATEGORIES} from '../src/lib/photoVault.js';

const settings={openingBalance:'50',alertThreshold:'10'};
const data={events:[{id:'e1',values:['Fête','2026-12-06','Liernais']}],tasks:[{id:'t1',values:['Affiches','Jocelyn','demain'],eventId:'e1'}]};
const backup=()=>createCombinedDemoBackup(data,{e1:{'🍹 Bar':2}},'2026-11-18T10:00:00Z',settings);
const extras={volunteerNeeds:{},ecocupSettings:{openingBalance:'0',alertThreshold:'100'},tillConfig:{},reviews:{},photos:[]};
const zip=photos=>makeCompleteBackupZip({backupJSON:backup(),menuJSON:JSON.stringify({format:'festapp-till-menus',version:1,menus:{'Fête':[{id:'petite-eau',priceCents:200}]}}),reviewJSON:JSON.stringify({format:'festapp-owner-review',version:1,reviews:{}}),photos});

test('restores records and settings from a full offline ZIP, with original photo bytes',async()=>{
 // Select a known product identifier from the existing till catalog.
 const archive=await zip([]);
 const parsed=await readCompleteBackupZip(archive);
 const plan=await planCompleteZipRestore(parsed,{events:[]},extras);
 assert.equal(plan.safe,true,JSON.stringify(plan.conflicts));
 assert.equal(plan.addedRecords,2);
 assert.deepEqual(plan.nextData.tasks[0].eventId,'e1');
 assert.deepEqual(plan.nextEcocups,settings);
 assert.equal(plan.nextNeeds.e1['🍹 Bar'],2);
 assert.equal(plan.addedPhotos,0);
});

test('ZIP import is idempotent and never overwrites a different existing record',async()=>{
 const parsed=await readCompleteBackupZip(await zip([]));
 const one=await planCompleteZipRestore(parsed,data,{...extras,ecocupSettings:settings});
 assert.equal(one.safe,true);
 assert.equal(one.addedRecords,0);
 assert.equal(one.unchangedRecords,2);
 const different={...data,tasks:[{...data.tasks[0],values:['Affiches modifiées','Jocelyn','demain']}]};
 const conflict=await planCompleteZipRestore(parsed,different,{...extras,ecocupSettings:settings});
 assert.equal(conflict.safe,false);
 assert.ok(conflict.conflicts.some(message=>message.includes('déjà modifiée')));
 assert.equal(different.tasks[0].values[0],'Affiches modifiées');
});

test('detects byte corruption, unexpected format, and truncation before any import',async()=>{
 const original=new Uint8Array(await (await zip([])).arrayBuffer());
 const altered=original.slice();altered[60]^=0x20;
 await assert.rejects(readCompleteBackupZip(new Blob([altered])),/endommagé/);
 await assert.rejects(readCompleteBackupZip(new Blob([original.slice(0,-10)])),/endommagé/);
 await assert.rejects(readCompleteBackupZip(new Blob(['not a zip'])),/endommagé/);
});

test('restores real photo blobs and deduplicates an identical original without discarding different contents',async()=>{
 const photo={scope:'recipes',fileName:'note.jpg',recordId:'',addedAt:'2026-11-18T10:00:00Z',size:3,blob:new Blob(['abc'])};
 const parsed=await readCompleteBackupZip(await zip([photo]));
 assert.equal(await parsed.photos[0].blob.text(),'abc');
 assert.equal(parsed.photos[0].type,'image/jpeg');
 const first=await planCompleteZipRestore(parsed,{},extras);
 assert.equal(first.safe,true);
 assert.equal(first.addedPhotos,1);
 const repeat=await planCompleteZipRestore(parsed,{}, {...extras,photos:[{...photo}]});
 assert.equal(repeat.safe,true);
 assert.equal(repeat.addedPhotos,0);
 assert.equal(repeat.unchangedPhotos,1);
 const changed=await planCompleteZipRestore(parsed,{}, {...extras,photos:[{...photo,blob:new Blob(['xyz'])}]});
 assert.equal(changed.addedPhotos,1);
});

test('full ZIP backs up and previews original icon photos from every module',async()=>{
 const originals=PHOTO_CATEGORIES.map((scope,index)=>({scope,fileName:`${scope}.jpg`,recordId:`record-${index}`,addedAt:'2026-11-20T10:00:00Z',size:3,blob:new Blob(['abc'])}));
 const archive=await readCompleteBackupZip(await zip(originals));
 assert.deepEqual(new Set(archive.photos.map(photo=>photo.scope)),new Set(PHOTO_CATEGORIES));
 const plan=await planCompleteZipRestore(archive,{},extras);
 assert.equal(plan.safe,true,plan.conflicts.join('; '));
 assert.equal(plan.addedPhotos,PHOTO_CATEGORIES.length);
 for(const photo of archive.photos)assert.equal(await photo.blob.text(),'abc');
});

test('ZIP restore refuses more than 100 original photos for a newly added section',async()=>{
 const originals=Array.from({length:101},(_,index)=>({scope:'contacts',fileName:`benevole-${index}.jpg`,recordId:`contact-${index}`,addedAt:'2026-11-20T10:00:00Z',size:1,blob:new Blob(['a'])}));
 const archive=await readCompleteBackupZip(await zip(originals));
 const plan=await planCompleteZipRestore(archive,{},extras);
 assert.equal(plan.safe,false);
 assert.match(plan.conflicts.join(' '),/100 photos.*contacts/);
});
