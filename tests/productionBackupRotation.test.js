import test from 'node:test';
import assert from 'node:assert/strict';
import {rotateVerifiedProductionBackups,saveProductionFullBackup} from '../src/lib/supabaseProductionBackup.js';
import {FESTAPP_SUPABASE_URL,FESTAPP_SPACE_ID} from '../src/lib/supabaseSharedRead.js';
const userId='90255835-5ac4-4880-a6df-11705b962c78';
const folder=FESTAPP_SPACE_ID+'/'+userId+'/';
const old=folder+'2026-11-23T09-00-00-000Z-00000000-0000-4000-8000-000000000001.zip';
const fresh=folder+'2026-11-24T09-00-00-000Z-00000000-0000-4000-8000-000000000002.zip';
function setup(rows,error=null){
 const calls=[];
 const files={async remove(paths){calls.push(paths);return {data:paths.map(name=>({name})),error:null};}};
 const client={supabaseUrl:FESTAPP_SUPABASE_URL,async rpc(name){assert.equal(name,'festapp_backup_rotation_candidates');return {data:rows,error};}};
 return {client,files,calls};
}
test('verified archive rotation removes only server-selected older own ZIPs',async()=>{
 const {client,files,calls}=setup([{path:old}]);
 const r=await rotateVerifiedProductionBackups(client,{spaceId:FESTAPP_SPACE_ID,userId,verifiedPath:fresh,files});
 assert.deepEqual(r,{rotationPending:false,removed:1});assert.deepEqual(calls,[[old]]);
});
test('rotation fails closed for fresh archive, wrong account, invalid paths or server error',async()=>{
 for(const rows of [[{path:fresh}],[{path:old.replace(userId,'00000000-0000-4000-8000-000000000009')}],[{path:folder+'../anything.zip'}],null]){
 const {client,files,calls}=setup(rows);
 assert.equal((await rotateVerifiedProductionBackups(client,{spaceId:FESTAPP_SPACE_ID,userId,verifiedPath:fresh,files})).rotationPending,true);
 assert.deepEqual(calls,[]);
 }
});
test('rotation cannot be reached after an unverified upload',async()=>{
 const calls=[];const zip=new Blob(['original'],{type:'application/zip'});
 const files={async upload(){calls.push('upload');return {error:null};},async download(){calls.push('download');return {data:new Blob(['modified'],{type:'application/zip'})};},async remove(){calls.push('remove');}};
 const query={select(){return this;},eq(){return this;},async maybeSingle(){return {data:{role:'admin'}};}};
 const client={supabaseUrl:FESTAPP_SUPABASE_URL,auth:{async getUser(){return {data:{user:{id:userId}}};}},from(){return query;},storage:{from(){return files;}},async rpc(){calls.push('rpc');}};
 await assert.rejects(saveProductionFullBackup(client,{spaceId:FESTAPP_SPACE_ID,backup:zip,productionMode:true}),/non vérifiée/);
 assert.deepEqual(calls,['upload','download']);
});
