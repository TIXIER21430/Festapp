import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {saveProductionSnapshot} from '../src/lib/supabaseProductionSync.js';
import {saveProductionFullBackup,downloadLatestProductionFullBackup} from '../src/lib/supabaseProductionBackup.js';
import {readProductionPrivateDriveCatalog} from '../src/lib/supabaseProductionDrive.js';
import {FESTAPP_SUPABASE_URL,FESTAPP_SPACE_ID} from '../src/lib/supabaseSharedRead.js';

const repoFile=name=>readFileSync(new URL('../'+name,import.meta.url),'utf8');
function mockSync({url=FESTAPP_SUPABASE_URL,user=true,conflict=false,error=null}={}){
 const calls=[];
 const query={
  update(value){calls.push(['update',value]);return this;},
  eq(key,value){calls.push(['eq',key,value]);return this;},
  select(value){calls.push(['select',value]);return this;},
  async maybeSingle(){return {data:conflict?null:{revision:2,updated_at:'2026-11-24T08:00:00Z'},error};}
 };
 return {supabaseUrl:url,calls,auth:{getUser:async()=>({data:{user:user?{id:'member'}:null}})},from(table){calls.push(['from',table]);return query;}};
}

test('production updates require exact project, space and explicit mode',async()=>{
 for(const url of [undefined,'https://ddpaxzdwxqwypcumjvvn.supabase.co','https://pomssbugayytzmmgvflg.supabase.co.attacker.test']){
  const c=mockSync({url});
  await assert.rejects(saveProductionSnapshot(c,{spaceId:FESTAPP_SPACE_ID,expectedRevision:1,payload:{data:{}},productionMode:true}));
  assert.deepEqual(c.calls,[]);
 }
 const c=mockSync();
 await assert.rejects(saveProductionSnapshot(c,{spaceId:FESTAPP_SPACE_ID,expectedRevision:1,payload:{},productionMode:false}));
 await assert.rejects(saveProductionSnapshot(c,{spaceId:'d4dbe793-56bb-4dad-a76c-5ac322b1e5b1',expectedRevision:1,payload:{},productionMode:true}));
 assert.deepEqual(c.calls,[]);
});
test('production updates use revision compare-and-swap and do not overwrite conflicts',async()=>{
 const c=mockSync();
 const r=await saveProductionSnapshot(c,{spaceId:FESTAPP_SPACE_ID,expectedRevision:'1',payload:{data:{events:[]}},productionMode:true});
 assert.equal(r.revision,'2');
 assert.deepEqual(c.calls,[
  ['from','festapp_snapshots'],['update',{payload:{data:{events:[]}},revision:'2'}],
  ['eq','space_id',FESTAPP_SPACE_ID],['eq','revision','1'],['select','revision,updated_at']
 ]);
 const conflict=mockSync({conflict:true});
 await assert.rejects(saveProductionSnapshot(conflict,{spaceId:FESTAPP_SPACE_ID,expectedRevision:1,payload:{},productionMode:true}),/Conflit/);
});
test('production archive refuses TEST, unknown spaces and unauthenticated attempts before upload',async()=>{
 const zip=new Blob(['PK\u0003\u0004archive'],{type:'application/zip'});
 for(const url of ['https://ddpaxzdwxqwypcumjvvn.supabase.co','https://example.invalid']){
  const c={supabaseUrl:url};
  await assert.rejects(saveProductionFullBackup(c,{spaceId:FESTAPP_SPACE_ID,backup:zip,productionMode:true}));
  await assert.rejects(downloadLatestProductionFullBackup(c,{spaceId:FESTAPP_SPACE_ID,productionMode:true}));
 }
 const c={supabaseUrl:FESTAPP_SUPABASE_URL};
 await assert.rejects(saveProductionFullBackup(c,{spaceId:FESTAPP_SPACE_ID,backup:zip,productionMode:false}));
 await assert.rejects(saveProductionFullBackup(c,{spaceId:FESTAPP_SPACE_ID,backup:zip,productionMode:true}),/Connexion/);
});
test('Drive catalog stays private and refuses a TEST backend',async()=>{
 const c={supabaseUrl:'https://ddpaxzdwxqwypcumjvvn.supabase.co'};
 await assert.rejects(readProductionPrivateDriveCatalog(c,{spaceId:FESTAPP_SPACE_ID,productionMode:true}),/PRODUCTION/);
});
test('production app mounts only after Supabase member verification',()=>{
 const app=repoFile('src/main.jsx');
 const gate=repoFile('src/ProductionGate.jsx');
 const cloud=repoFile('src/ProductionCloud.jsx');
 assert.match(app,/<ProductionGate><App\/><\/ProductionGate>/);
 assert.match(gate,/readSharedSpace\(client,config\.spaceId\)/);
 assert.match(gate,/stage==='ready'&&!requiresPassword/);
 assert.match(gate,/resetPasswordForEmail/);
 assert.match(gate,/updateUser\(\{password:newPassword\}\)/);
 assert.match(cloud,/saveProductionSnapshot/);
 assert.match(cloud,/saveProductionFullBackup/);
 assert.match(cloud,/readProductionPrivateDriveCatalog/);
 assert.match(cloud,/setInterval\(async\(\)=>/);
});
test('production env contains only browser publishable key, never a server secret',()=>{
 const env=repoFile('.env.production');
 assert.match(env,/VITE_FESTAPP_PRODUCTION_MODE=true/);
 assert.match(env,/VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_/);
 assert.doesNotMatch(env,/service_role|sb_secret_|password\s*=/i);
 const drive=repoFile('src/lib/driveFolders.js');
 assert.doesNotMatch(drive,/drive\.google\.com\/drive\/folders\/[A-Za-z0-9_-]{10,}/);
});
