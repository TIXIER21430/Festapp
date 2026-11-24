import test from 'node:test';
import assert from 'node:assert/strict';
import {planPhotoSync,syncProductionPhotos} from '../src/lib/supabaseProductionPhotos.js';
test('independent photos from two devices are exchanged without replacing either',()=>{
 const p=planPhotoSync([{id:'a'},{id:'same'}],[{id:'b'},{id:'same'}]);
 assert.deepEqual(p.upload,[{id:'a'}]);assert.deepEqual(p.download,[{id:'b'}]);
});
test('deletion markers take precedence over stale originals, including fresh devices',()=>{
 const p=planPhotoSync([{id:'a',deletedAt:'now'},{id:'b'}],[{id:'a'},{id:'b',deleted_at:'now'},{id:'c',deleted_at:'now'}]);
 assert.deepEqual(p.deleteRemote,[{id:'a',deletedAt:'now'}]);assert.deepEqual(p.deleteLocal,[{id:'b',deleted_at:'now'},{id:'c',deleted_at:'now'}]);
 assert.equal(p.upload.length,0);assert.equal(p.download.length,0);
});
test('unconfirmed offline deletion never reuploads',()=>assert.deepEqual(planPhotoSync([{id:'a',deletedAt:'now'}],[]).upload,[]));
test('wrong backend cannot access photos',async()=>{await assert.rejects(syncProductionPhotos({supabaseUrl:'https://example.invalid'},{productionMode:true}),/hors production/);});

import {FESTAPP_SPACE_ID,FESTAPP_SUPABASE_URL} from '../src/lib/supabaseSharedRead.js';
test('two independent devices exchange original bytes and propagate deletion without resurrection',async()=>{
 const photos=new Map(),objects=new Map();
 const client={supabaseUrl:FESTAPP_SUPABASE_URL,auth:{getUser:async()=>({data:{user:{id:'member'}}})},
  from(table){
   let id,patch;
   const q={select(){return q;},eq(key,value){if(key==='id')id=value;return q;},order(){return q;},range(){return Promise.resolve({data:[...photos.values()]});},
    maybeSingle:async()=>({data:{role:'editor'}}),
    async insert(row){if(photos.has(row.id))return {error:{code:'23505'}};photos.set(row.id,row);return {};},
    update(value){patch=value;return q;},async is(){const row=photos.get(id);if(row&&!row.deleted_at)photos.set(id,{...row,...patch});return {};}};return q;
  },
  storage:{from(){return {async upload(path,blob){if(objects.has(path))return {error:{message:'duplicate'}};objects.set(path,blob);return {};},async download(path){return {data:objects.get(path)};}};}}
 };
 const id='11111111-1111-4111-8111-111111111111';
 const photo={id,scope:'events',recordId:'event-1',fileName:'test.png',type:'image/png',size:3,addedAt:'2026-11-24T12:00:00Z',blob:new Blob(['abc'],{type:'image/png'})};
 const device=(rows=[])=>{const map=new Map(rows.map(row=>[row.id,row]));return {map,list:async()=>[...map.values()],remove:async(id,deletedAt)=>{if(map.get(id)?.deletedAt)return false;map.set(id,{id,deletedAt});return true;},cache:async(row)=>{if(map.has(row.id))return false;map.set(row.id,row);return true;}};};
 const a=device([photo]),b=device();
 const run=localStore=>syncProductionPhotos(client,{spaceId:FESTAPP_SPACE_ID,productionMode:true,localStore});
 await run(a);assert.equal(photos.size,1);
 await run(b);assert.equal(await b.map.get(id).blob.text(),'abc');
 await b.remove(id,'2026-11-24T12:01:00Z');await run(b);await run(a);
 assert.ok(a.map.get(id).deletedAt);assert.ok(photos.get(id).deleted_at);
 await run(a);assert.equal(objects.size,1);assert.ok(photos.get(id).deleted_at);
});
