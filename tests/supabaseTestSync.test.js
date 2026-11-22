import test from "node:test";
import assert from "node:assert/strict";
import {saveTestSnapshot,sameTestSnapshotData} from "../src/lib/supabaseTestSync.js";
import {FESTAPP_TEST_URL} from "../src/lib/supabaseClient.js";
const spaceId="d4dbe793-56bb-4dad-a76c-5ac322b1e5b1";
function mock({user=true,conflict=false,error=null}={}){
 const calls=[];const q={update(v){calls.push(["update",v]);return this},eq(k,v){calls.push(["eq",k,v]);return this},select(v){calls.push(["select",v]);return this},async maybeSingle(){return {data:conflict?null:{revision:2,updated_at:"2026-11-18T12:00:00Z"},error}}};
 return {calls,supabaseUrl:FESTAPP_TEST_URL,auth:{getUser:async()=>({data:{user:user?{id:"u1"}:null}})},from(table){calls.push(["from",table]);return q}};
}
test("never writes to a production or unknown backend even when TEST flag is true",async()=>{
 for(const url of ["https://pomssbugayytzmmgvflg.supabase.co",undefined,"https://ddpaxzdwxqwypcumjvvn.supabase.co.evil.test"]){
  const c=mock();c.supabaseUrl=url;
  await assert.rejects(saveTestSnapshot(c,{spaceId,expectedRevision:1,payload:{},testMode:true}),/projet ou espace/);
  assert.deepEqual(c.calls,[]);
 }
});
test("rejects even a valid UUID if it points to a different TEST space",async()=>{
 const c=mock();
 await assert.rejects(saveTestSnapshot(c,{spaceId:"83d56d91-ecee-4d07-8d1f-ca8fd686f0eb",expectedRevision:1,payload:{},testMode:true}),/projet ou espace/);
 assert.deepEqual(c.calls,[]);
});
test("refuses any write outside explicitly enabled TEST mode",async()=>{
 const c=mock();await assert.rejects(saveTestSnapshot(c,{spaceId,expectedRevision:1,payload:{},testMode:false}),/interdite/);
 assert.deepEqual(c.calls,[]);
});
test("requires authentication",async()=>{
 const c=mock({user:false});await assert.rejects(saveTestSnapshot(c,{spaceId,expectedRevision:1,payload:{},testMode:true}),/Connexion/);
 assert.deepEqual(c.calls,[]);
});
test("uses optimistic revision and returns new version",async()=>{
 const c=mock();const result=await saveTestSnapshot(c,{spaceId,expectedRevision:1,payload:{data:{events:[]}},testMode:true});
 assert.equal(result.revision,"2");
 assert.deepEqual(c.calls,[["from","festapp_snapshots"],["update",{payload:{data:{events:[]}},revision:"2"}],["eq","space_id",spaceId],["eq","revision","1"],["select","revision,updated_at"]]);
});
test("rejects conflicts without silently overwriting",async()=>{
 const c=mock({conflict:true});await assert.rejects(saveTestSnapshot(c,{spaceId,expectedRevision:1,payload:{},testMode:true}),/Conflit/);
});
test("rejects invalid payloads and revisions",async()=>{
 const c=mock();await assert.rejects(saveTestSnapshot(c,{spaceId,expectedRevision:0,payload:{},testMode:true}),/Révision/);
 await assert.rejects(saveTestSnapshot(c,{spaceId,expectedRevision:1,payload:[],testMode:true}),/Données/);
 assert.deepEqual(c.calls,[]);
});
test("readback comparison tolerates reordered JSONB object keys without hiding changes",()=>{
 const original={events:[{id:"abc",values:["Nom","Date","Lieu"],done:false}],tasks:[]};
 const reordered={tasks:[],events:[{values:["Nom","Date","Lieu"],done:false,id:"abc"}]};
 assert.equal(sameTestSnapshotData(original,reordered),true);
 reordered.events[0].values[1]="Autre date";
 assert.equal(sameTestSnapshotData(original,reordered),false);
});
