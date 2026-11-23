import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readTestPrivateDriveCatalog} from '../src/lib/supabasePrivateDrive.js';
import {FESTAPP_TEST_URL,FESTAPP_TEST_SPACE_ID} from '../src/lib/supabaseClient.js';

const options={spaceId:FESTAPP_TEST_SPACE_ID,testMode:true};
function driveRow(i,mime='application/pdf'){
 return {file_id:`file-${String(i).padStart(4,'0')}`,name:`Document ${i}`,mime_type:mime,
  folder_path:'Manifestations/Édition',web_url:`https://drive.google.com/file/d/file-${i}/view`,indexed_at:'2026-11-23T10:00:00Z'};
}
function fakeClient({signedIn=true,member=true,rows=[driveRow(0)],error=null}={}){
 const calls=[];
 const client={supabaseUrl:FESTAPP_TEST_URL,calls,
  auth:{getUser:async()=>{calls.push('auth');return {data:{user:signedIn?{id:'member-id'}:null}};}},
  from(table){
   calls.push(table);
   const q={select(){return this;},eq(){return this;},order(){return this;},
    maybeSingle:async()=>({data:member?{space_id:FESTAPP_TEST_SPACE_ID}:null,error:null}),
    range:async(start,end)=>({data:rows.slice(start,end+1),error})};
   return q;
  }};
 return client;
}

test('never requests data outside the exact TEST project and space',async()=>{
 for(const variant of [{testMode:false},{spaceId:'83d56d91-ecee-4d07-8d1f-ca8fd686f0eb'},{url:'https://pomssbugayytzmmgvflg.supabase.co'}]){
  const client=fakeClient();if(variant.url)client.supabaseUrl=variant.url;
  await assert.rejects(readTestPrivateDriveCatalog(client,{...options,...variant}),/hors de Supabase TEST/);
  assert.deepEqual(client.calls,[]);
 }
});
test('requires authentication and real committee membership before fetching files',async()=>{
 for(const config of [{signedIn:false},{member:false}]){
  const client=fakeClient(config);
  await assert.rejects(readTestPrivateDriveCatalog(client,options),/Connectez-vous|non autorisé/);
  assert.equal(client.calls.includes('festapp_drive_files'),false);
 }
});
test('paginates past the default Supabase 1000-row cap and calculates types',async()=>{
 const rows=Array.from({length:1135},(_,i)=>driveRow(i,i%4===0?'image/jpeg':i%4===1?'audio/mpeg':i%4===2?'video/mp4':'application/pdf'));
 const client=fakeClient({rows});
 const catalog=await readTestPrivateDriveCatalog(client,options);
 assert.equal(catalog.files.length,1135);
 assert.equal(catalog.files[1134].title,'Document 1134');
 assert.equal(catalog.stats.images,284);
 assert.equal(catalog.stats.audio,284);
 assert.equal(catalog.stats.videos,284);
 assert.equal(catalog.stats.documents,283);
 assert.equal(catalog.seed,null);
 assert.equal(client.calls.filter(x=>x==='festapp_drive_files').length,3);
 assert.equal(catalog.asOf,'23/11/2026');
});
test('never exposes a partial index if links or rows are unsafe',async()=>{
 for(const row of [{...driveRow(0),web_url:'https://evil.example/steal'}, {...driveRow(0),name:null}]){
  const client=fakeClient({rows:[row]});
  await assert.rejects(readTestPrivateDriveCatalog(client,options),/invalide/);
 }
 const client=fakeClient({error:{message:'RLS denied'}});
 await assert.rejects(readTestPrivateDriveCatalog(client,options),/Impossible de charger/);
});
test('UI never loads private Drive metadata publicly or auto-imports it into editable records',()=>{
 const app=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 const access=readFileSync(new URL('../src/SharedAccess.jsx',import.meta.url),'utf8');
 const drive=readFileSync(new URL('../src/DriveBoard.jsx',import.meta.url),'utf8');
 assert.doesNotMatch(app,/fetch\(`\$\{import\.meta\.env\.BASE_URL\}drive-data\.json`/);
 assert.match(app,/onDriveCatalog=\{setDriveCatalog\}/);
 assert.match(access,/readTestPrivateDriveCatalog\(client,/);
 assert.match(access,/onDriveCatalog\?\.\(null\)/);
 assert.match(drive,/catalog\.seed&&<div className="drive-source"/);
});
test('auth completion rechecks membership after sign-in releases its lock',()=>{
 const access=readFileSync(new URL('../src/SharedAccess.jsx',import.meta.url),'utf8');
 assert.match(access,/const \[authSettled,setAuthSettled\]=useState\(0\)/);
 assert.match(access,/\},\[signedIn,authSettled\]\)/);
 assert.match(access,/finally\{lock\.current=false;setBusy\(false\);setAuthSettled\(n=>n\+1\);\}/);
});
