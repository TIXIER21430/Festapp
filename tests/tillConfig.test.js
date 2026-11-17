import test from "node:test";
import assert from "node:assert/strict";
import {validateTillConfig,eventTillProducts,loadTillConfig,saveTillConfig,TILL_CONFIG_KEY} from "../src/lib/tillConfig.js";
test("customizes a single event without changing other events",()=>{
 const config=validateTillConfig({"Marché de Noël":[{id:"vin-chaud",priceCents:450}]});
 assert.deepEqual(eventTillProducts("Marché de Noël",config).map(p=>[p.id,p.priceCents]),[["vin-chaud",450]]);
 assert.ok(eventTillProducts("Saint-Laurent",config).length>1);
});
test("rejects duplicates, unknown products and invalid prices",()=>{
 assert.throws(()=>validateTillConfig({x:[{id:"invalid",priceCents:10}]}),TypeError);
 assert.throws(()=>validateTillConfig({x:[{id:"coca",priceCents:-1}]}),TypeError);
 assert.throws(()=>validateTillConfig({x:[{id:"coca",priceCents:10},{id:"coca",priceCents:20}]}),TypeError);
});
test("persists locally and protects corrupt settings",()=>{
 const values=new Map();
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)};
 saveTillConfig(storage,{x:[{id:"coca",priceCents:300}]});
 assert.equal(loadTillConfig(storage).config.x[0].priceCents,300);
 values.set(TILL_CONFIG_KEY,"{invalid");
 assert.ok(loadTillConfig(storage).warning);
});
