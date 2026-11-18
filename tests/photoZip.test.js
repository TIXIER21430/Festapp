import test from 'node:test';
import assert from 'node:assert/strict';
import {makePhotoZip,photoCrc32} from '../src/lib/photoZip.js';

const utf8=new TextDecoder();

test('ZIP CRC32 matches the standard test vector',()=>{
 assert.equal(photoCrc32(new TextEncoder().encode('123456789')),0xcbf43926);
});

test('exports original bytes, safe names and a mapping manifest in a well-formed ZIP',async()=>{
 const bytes=new Uint8Array([0,1,2,30,255]);
 const zip=await makePhotoZip([{id:'abc',scope:'recipes',fileName:'crêpes été.jpg',size:bytes.length,recordId:'r1',addedAt:'2026-11-18',blob:new Blob([bytes])}], 'recipes');
 assert.equal(zip.type,'application/zip');
 const arr=new Uint8Array(await zip.arrayBuffer());
 const data=new DataView(arr.buffer);
 assert.equal(data.getUint32(0,true),0x04034b50);
 const nameLength=data.getUint16(26,true);
 const name=utf8.decode(arr.subarray(30,30+nameLength));
 assert.match(name,/^photos\/001-crêpes/);
 assert.equal(data.getUint32(14,true),photoCrc32(bytes));
 assert.deepEqual(arr.slice(30+nameLength,30+nameLength+bytes.length),bytes);
 const second=30+nameLength+bytes.length;
 assert.equal(data.getUint32(second,true),0x04034b50);
 const manifestNameLength=data.getUint16(second+26,true);
 assert.equal(utf8.decode(arr.subarray(second+30,second+30+manifestNameLength)),'FESTAPP-liste-des-photos.json');
 const manifestSize=data.getUint32(second+18,true);
 const manifest=JSON.parse(utf8.decode(arr.subarray(second+30+manifestNameLength,second+30+manifestNameLength+manifestSize)));
 assert.equal(manifest.photos[0].ficheAssociee,'r1');
 assert.equal(manifest.photos[0].fichier,name);
 const end=arr.length-22;
 assert.equal(data.getUint32(end,true),0x06054b50);
 assert.equal(data.getUint16(end+10,true),2);
 const centralStart=data.getUint32(end+16,true);
 assert.equal(data.getUint32(centralStart,true),0x02014b50);
 assert.equal(data.getUint32(centralStart+42,true),0);
});

test('rejects mismatched scope, malformed photos and over-limit batches',async()=>{
 const photo={scope:'posts',size:3,blob:new Blob(['abc']),fileName:'test.jpg'};
 await assert.rejects(makePhotoZip([photo],'finance'),/incompatible/);
 await assert.rejects(makePhotoZip([{...photo,size:100}],'posts'),/incompatible/);
 await assert.rejects(makePhotoZip(Array.from({length:101},()=>photo),'posts'),/invalide/);
});
