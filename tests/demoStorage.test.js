import test from "node:test";
import assert from "node:assert/strict";
import {readDemoStorage,writeDemoStorage,DEMO_STORAGE_KEY} from "../src/lib/demoStorage.js";

const seed={events:[{id:"seed-1",values:["Carnaval","",""]}]};
function memoryStorage(initial=null){
  let value=initial;
  return {
    getItem(key){assert.equal(key,DEMO_STORAGE_KEY);return value;},
    setItem(key,next){assert.equal(key,DEMO_STORAGE_KEY);value=next;},
    current(){return value;}
  };
}
test("new demo starts with seed without a warning",()=>{
  const result=readDemoStorage(memoryStorage(),seed);
  assert.deepEqual(result,{data:seed,warning:""});
});
test("valid saved data remains available and seed categories are preserved",()=>{
  const store=memoryStorage(JSON.stringify({contacts:[{id:"a",values:["Alice","bénévole","0600000000"]}]}));
  const result=readDemoStorage(store,seed);
  assert.equal(result.warning,"");
  assert.equal(result.data.contacts[0].values[0],"Alice");
  assert.deepEqual(result.data.events,seed.events);
});
test("corrupt stored data is never erased on read",()=>{
  const store=memoryStorage("{bad");
  const result=readDemoStorage(store,seed);
  assert.match(result.warning,/Impossible de lire/);
  assert.deepEqual(result.data,seed);
  assert.equal(store.current(),"{bad");
});
test("storage quota error is surfaced and in-memory data is not changed",()=>{
  const data={contacts:[{id:"a",values:["Alice","bénévole","0600000000"]}]};
  const store={setItem(){throw new Error("QuotaExceededError")}};
  const result=writeDemoStorage(store,data);
  assert.equal(result.saved,false);
  assert.match(result.warning,/Enregistrement local impossible/);
  assert.equal(data.contacts[0].values[0],"Alice");
});
test("valid data is saved and malformed data cannot overwrite storage",()=>{
  const store=memoryStorage();
  assert.equal(writeDemoStorage(store,seed).saved,true);
  const snapshot=store.current();
  assert.equal(writeDemoStorage(store,{events:[{id:"bad",values:["only one"]}]}).saved,false);
  assert.equal(store.current(),snapshot);
});
