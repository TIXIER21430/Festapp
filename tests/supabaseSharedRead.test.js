import test from "node:test";
import assert from "node:assert/strict";
import {readSharedSpace,FESTAPP_SPACE_ID} from "../src/lib/supabaseSharedRead.js";
function client(member=true){
 const calls=[];
 const c={calls,auth:{getUser:async()=>({data:{user:{id:"u1"}},error:null})},from(table){
  calls.push(table);
  const query={select(){return this},eq(){return this},maybeSingle:async()=>({data:member?{space_id:FESTAPP_SPACE_ID}:null,error:null}),single:async()=>({data:{space_id:FESTAPP_SPACE_ID,revision:1,updated_at:"2026-11-17",payload:{data:{events:[]},volunteerNeeds:{}}},error:null})};
  return query;
 }};
 return c;
}
test("authorized member reads only and returns validated payload",async()=>{
 const c=client();const result=await readSharedSpace(c);
 assert.equal(result.revision,"1");assert.deepEqual(result.data,{events:[]});
 assert.deepEqual(c.calls,["festapp_members","festapp_snapshots"]);
});
test("non-member cannot read snapshot",async()=>{
 const c=client(false);
 await assert.rejects(readSharedSpace(c),/pas encore accès/);
 assert.deepEqual(c.calls,["festapp_members"]);
});
test("unauthenticated session refused",async()=>{
 const c=client();c.auth.getUser=async()=>({data:{user:null},error:null});
 await assert.rejects(readSharedSpace(c),/Connectez-vous/);
 assert.deepEqual(c.calls,[]);
});
