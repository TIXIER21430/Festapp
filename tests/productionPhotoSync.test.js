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
