import test from 'node:test';
import assert from 'node:assert/strict';
import {saveTestFullBackup,downloadLatestTestFullBackup,MAX_TEST_BACKUP_BYTES,TEST_BACKUP_BUCKET} from '../src/lib/supabaseTestBackup.js';
import {FESTAPP_TEST_SPACE_ID,FESTAPP_TEST_URL} from '../src/lib/supabaseClient.js';

const userId='b3e0f79e-8a21-41b8-8d84-37bd9c947287';
const zip=()=>new Blob(['PK\x03\x04contenu'],{type:'application/zip'});
function fakeClient({member='admin',signedIn=true,readback=null,uploadError=null}={}){
 const calls=[];
 const blob=readback??zip();
 const storage={upload:async(path,payload,options)=>{calls.push(['upload',path,payload,options]);return {error:uploadError};},download:async path=>{calls.push(['download',path]);return {data:blob,error:null};}};
 const client={supabaseUrl:FESTAPP_TEST_URL,calls,
  auth:{getUser:async()=>{calls.push(['getUser']);return {data:{user:signedIn?{id:userId}:null}};}},
  from:table=>{calls.push(['from',table]);return {select:()=>({eq(){return this;},maybeSingle:async()=>({data:member?{role:member}:null,error:null})})};},
  storage:{from:bucket=>{calls.push(['bucket',bucket]);return storage;}}
 };
 return client;
}

test('rejects wrong project, space and mode without auth or network calls',async()=>{
 for(const config of [{testMode:false},{spaceId:'83d56d91-ecee-4d07-8d1f-ca8fd686f0eb'},{clientUrl:'https://pomssbugayytzmmgvflg.supabase.co'}]){
  const client=fakeClient();if(config.clientUrl)client.supabaseUrl=config.clientUrl;
  await assert.rejects(saveTestFullBackup(client,{spaceId:config.spaceId??FESTAPP_TEST_SPACE_ID,backup:zip(),testMode:config.testMode??true}),/refusée/);
  assert.deepEqual(client.calls,[]);
 }
});
test('refuses malformed and oversized archives without auth requests',async()=>{
 for(const backup of [null,new Blob(['texte'],{type:'text/plain'}),new Blob([new Uint8Array(MAX_TEST_BACKUP_BYTES+1)],{type:'application/zip'})]){
  const client=fakeClient();await assert.rejects(saveTestFullBackup(client,{spaceId:FESTAPP_TEST_SPACE_ID,backup,testMode:true}),/Archive ZIP/);
  assert.deepEqual(client.calls,[]);
 }
});
test('refuses unauthorized users and readers before Storage access',async()=>{
 for(const options of [{signedIn:false},{member:null},{member:'reader'}]){
  const client=fakeClient(options);
  await assert.rejects(saveTestFullBackup(client,{spaceId:FESTAPP_TEST_SPACE_ID,backup:zip(),testMode:true}),/Connexion individuelle|Ce compte/);
  assert.equal(client.calls.some(call=>call[0]==='bucket'),false);
 }
});
test('uploads an immutable private TEST ZIP and verifies the exact returned bytes',async()=>{
 const client=fakeClient();
 const result=await saveTestFullBackup(client,{spaceId:FESTAPP_TEST_SPACE_ID,backup:zip(),testMode:true});
 assert.equal(result.verified,true);assert.equal(result.sha256.length,64);
 assert.match(result.path,new RegExp(`^${FESTAPP_TEST_SPACE_ID}/${userId}/.*\\.zip$`));
 assert.deepEqual(client.calls.find(call=>call[0]==='upload')[3],{upsert:false,contentType:'application/zip',cacheControl:'0'});
 assert.deepEqual(client.calls.find(call=>call[0]==='bucket'),['bucket',TEST_BACKUP_BUCKET]);
 assert.deepEqual(client.calls.filter(call=>call[0]==='download').length,1);
});
test('never claims a backup succeeded after upload error or corrupted readback',async()=>{
 for(const options of [{uploadError:new Error('refused')},{readback:new Blob(['autres'],{type:'application/zip'})}]){
  const client=fakeClient(options);
  await assert.rejects(saveTestFullBackup(client,{spaceId:FESTAPP_TEST_SPACE_ID,backup:zip(),testMode:true}),/refusé|non vérifiée/);
 }
});
test('recovers the last private archive for the signed-in user without restoring locally',async()=>{
 const client=fakeClient();const date='2026-11-23T10-11-12-000Z';
 const filename=`${date}-9c6441f2-f2ce-424d-9d84-4ec8f29e87fa.zip`;
 client.storage.from=()=>({
  list:async(folder,opts)=>{client.calls.push(['list',folder,opts]);return {data:[{name:filename,id:'object1',created_at:'2026-11-23T10:11:12Z'}],error:null};},
  download:async path=>{client.calls.push(['download',path]);return {data:zip(),error:null};}
 });
 const result=await downloadLatestTestFullBackup(client,{spaceId:FESTAPP_TEST_SPACE_ID,testMode:true});
 assert.equal(result.blob.size,zip().size);
 assert.match(result.name,/festapp-cloud-test-/);
 assert.deepEqual(client.calls.find(call=>call[0]==='list'),['list',`${FESTAPP_TEST_SPACE_ID}/${userId}`,{limit:100,sortBy:{column:'created_at',order:'desc'}}]);
 assert.equal(client.calls.filter(call=>call[0]==='download').length,1);
});
test('recovery refuses wrong project before any read and keeps missing backups harmless',async()=>{
 const client=fakeClient();client.supabaseUrl='https://pomssbugayytzmmgvflg.supabase.co';
 await assert.rejects(downloadLatestTestFullBackup(client,{spaceId:FESTAPP_TEST_SPACE_ID,testMode:true}),/refusée/);
 assert.deepEqual(client.calls,[]);
 const empty=fakeClient();empty.storage.from=()=>({list:async()=>({data:[],error:null})});
 await assert.rejects(downloadLatestTestFullBackup(empty,{spaceId:FESTAPP_TEST_SPACE_ID,testMode:true}),/Aucune archive/);
});
