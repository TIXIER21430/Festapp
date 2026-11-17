import test from "node:test";
import assert from "node:assert/strict";
import {createTillSharedAdapter} from "../src/lib/tillSharedAdapter.js";
test("rejects unconfirmed TEST access before any database operation",()=>{
 let called=false;
 const client={from(){called=true}};
 assert.throws(()=>createTillSharedAdapter(client),/TEST/);
 assert.equal(called,false);
});
test("rejects unauthenticated access",async()=>{
 const adapter=createTillSharedAdapter({auth:{getUser:async()=>({data:{user:null}})},from(){throw Error("must not query")}}, {testProjectConfirmed:true});
 await assert.rejects(adapter.list(),/Authentication/);
});
test("reads and saves only authenticated event menu",async()=>{
 const calls=[];
 const client={auth:{getUser:async()=>({data:{user:{id:"test-user"}}})},
 from(table){calls.push(["from",table]);return {select(columns){calls.push(["select",columns]);return {limit:async()=>({data:[{event_name:"Marché de Noël",menu:[{id:"vin-chaud",priceCents:350}],updated_at:"2026-11-17"}],error:null})}},upsert:async(row,opts)=>{calls.push(["upsert",row,opts]);return {error:null}}}}};
 const adapter=createTillSharedAdapter(client,{testProjectConfirmed:true});
 assert.equal((await adapter.list())[0].eventName,"Marché de Noël");
 await adapter.save("Marché de Noël",[{id:"vin-chaud",priceCents:350}]);
 assert.equal(calls.at(-1)[1].updated_by,"test-user");
 assert.equal(calls.at(-1)[2].onConflict,"event_name");
});
test("rejects invalid price before write",async()=>{
 let wrote=false;
 const client={auth:{getUser:async()=>({data:{user:{id:"test"}}})},from(){return {upsert(){wrote=true}}}};
 const adapter=createTillSharedAdapter(client,{testProjectConfirmed:true});
 await assert.rejects(adapter.save("Marché de Noël",[{id:"vin-chaud",priceCents:-1}]),TypeError);
 assert.equal(wrote,false);
});
