import test from "node:test";
import assert from "node:assert/strict";
import {createSharedReadAdapter} from "../src/lib/sharedReadAdapter.js";

test("refuses access without explicit independent TEST confirmation",()=>{
  const client={from(){throw Error("must not be called")}};
  assert.throws(()=>createSharedReadAdapter(client),/TEST/);
});
test("reads only whitelisted columns with an injected fake client",async()=>{
  const calls=[];
  const client={from(table){calls.push(["from",table]);return {select(cols){calls.push(["select",cols]);return {async limit(n){calls.push(["limit",n]);return {data:[{id:"a",title:"Carnaval"}],error:null}}}}}}};
  const adapter=createSharedReadAdapter(client,{testProjectConfirmed:true});
  assert.deepEqual(await adapter.list("events",{limit:20}),[{id:"a",title:"Carnaval"}]);
  assert.deepEqual(calls,[["from","fest_events"],["select","id,title,event_date,notes"],["limit",20]]);
  assert.equal(adapter.insert,undefined);
  assert.equal(adapter.delete,undefined);
});
test("rejects unrecognized modules and unbounded queries",async()=>{
  const adapter=createSharedReadAdapter({from(){throw Error("must not be called")}},{testProjectConfirmed:true});
  await assert.rejects(adapter.list("fest_members"),/Unknown module/);
  await assert.rejects(adapter.list("events",{limit:99999}),/Invalid page size/);
});
test("hides database error details from callers",async()=>{
  const client={from(){return {select(){return {async limit(){return {data:null,error:{message:"private SQL details"}}}}}}}}};
  const adapter=createSharedReadAdapter(client,{testProjectConfirmed:true});
  await assert.rejects(adapter.list("contacts"),e=>e.message==="Shared read failed");
});
