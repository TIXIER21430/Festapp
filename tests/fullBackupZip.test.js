import test from 'node:test';
import assert from 'node:assert/strict';
import {makeCompleteBackupZip,photoCrc32} from '../src/lib/photoZip.js';

function unzipStoredEntries(bytes){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 const entries=[];const decoder=new TextDecoder();let offset=0;
 while(view.getUint32(offset,true)===0x04034b50){
  const len=view.getUint16(offset+26,true);
  const size=view.getUint32(offset+18,true);
  const start=offset+30+len;
  const name=decoder.decode(bytes.subarray(offset+30,start));
  const content=bytes.slice(start,start+size);
  assert.equal(photoCrc32(content),view.getUint32(offset+14,true),name+' CRC');
  entries.push({name,content});offset=start+size;
 }
 const end=bytes.length-22;
 assert.equal(view.getUint32(end,true),0x06054b50);
 assert.equal(view.getUint32(offset,true),0x02014b50);
 assert.equal(view.getUint16(end+10,true),entries.length);
 assert.equal(view.getUint32(end+16,true),offset);
 return entries;
}

const base={backupJSON:JSON.stringify({format:'festapp-demo-backup',version:1,data:{events:[]}}),menuJSON:'{"Marché de Noël":[]}',reviewJSON:'{"reviews":{}}'};

test('complete offline ZIP includes the records, settings, reviews, originals, and association map',async()=>{
 const photos=[
  {scope:'recipes',fileName:'crêpes.jpg',recordId:'recipe-1',addedAt:'2026-11-18',size:3,blob:new Blob([new Uint8Array([0,255,2])])},
  {scope:'finance',fileName:'facture.jpg',recordId:'bill-1',size:4,blob:new Blob(['test'])}
 ];
 const archive=await makeCompleteBackupZip({...base,photos});
 assert.equal(archive.type,'application/zip');
 const files=unzipStoredEntries(new Uint8Array(await archive.arrayBuffer()));
 assert.equal(files.length,6);
 assert.deepEqual(files.slice(0,4).map(x=>x.name),['FESTAPP-sauvegarde.json','FESTAPP-menus-caisse.json','FESTAPP-verifications.json','FESTAPP-liste-des-photos.json']);
 assert.equal(new TextDecoder().decode(files[0].content),base.backupJSON);
 const map=JSON.parse(new TextDecoder().decode(files[3].content));
 assert.equal(map.photos.length,2);
 assert.deepEqual(map.photos.map(x=>x.ficheAssociee),['recipe-1','bill-1']);
 assert.deepEqual(files.filter(x=>x.name.startsWith('photos/')).map(x=>x.name),map.photos.map(x=>x.fichier));
 assert.deepEqual(files[4].content,new Uint8Array([0,255,2]));
});

test('full ZIP is useful even when no photo has been added yet',async()=>{
 const archive=await makeCompleteBackupZip({...base,photos:[]});
 const files=unzipStoredEntries(new Uint8Array(await archive.arrayBuffer()));
 assert.equal(files.length,4);
 assert.equal(JSON.parse(new TextDecoder().decode(files[3].content)).photos.length,0);
});

test('full ZIP fails closed on corrupt photos and invalid JSON',async()=>{
 await assert.rejects(makeCompleteBackupZip({...base,backupJSON:'not JSON',photos:[]}),/JSON est invalide/);
 await assert.rejects(makeCompleteBackupZip({...base,photos:[{scope:'finance',fileName:'a',size:5,blob:new Blob(['no'])}]}),/incompatible/);
 await assert.rejects(makeCompleteBackupZip({...base,photos:Array.from({length:501},()=>null)}),/invalide/);
});
