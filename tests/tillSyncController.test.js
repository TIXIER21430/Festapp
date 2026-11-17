import test from "node:test";
import assert from "node:assert/strict";
import {createTillSyncController} from "../src/lib/tillSyncController.js";
const menu=[{id:"vin-chaud",priceCents:350}];
test("refresh loads remote menus and revisions",async()=>{
 const sync=createTillSyncController({list:async()=>[{eventName:"Noël",menu,updatedAt:"2026-11-17T12:00:00Z"}],save:async()=>{}});
 assert.equal(await sync.refresh(),true);
 assert.deepEqual(sync.snapshot().menus["Noël"],menu);
 assert.equal(sync.snapshot().status,"synced");
});
test("refresh never overwrites unsaved edits",async()=>{
 const sync=createTillSyncController({list:async()=>[{eventName:"Noël",menu,updatedAt:"2026-11-17T12:00:00Z"}],save:async()=>{}});
 sync.edit("Noël",[{id:"vin-chaud",priceCents:400}]);
 await sync.refresh();
 assert.equal(sync.snapshot().menus["Noël"][0].priceCents,400);
 assert.equal(sync.snapshot().status,"unsaved");
});
test("network failure preserves local changes",async()=>{
 const sync=createTillSyncController({list:async()=>{throw Error("private network error")},save:async()=>{}});
 sync.edit("Noël",menu);
 assert.equal(await sync.refresh(),false);
 assert.equal(sync.snapshot().status,"offline");
 assert.deepEqual(sync.snapshot().menus["Noël"],menu);
 assert.doesNotMatch(sync.snapshot().error,/private network error/);
});
test("conflict keeps unsaved changes and reports conflict",async()=>{
 const sync=createTillSyncController({list:async()=>[],save:async()=>{throw Error("Menu changed elsewhere: reload before saving")}});
 sync.edit("Noël",menu);
 assert.equal(await sync.save("Noël"),false);
 assert.equal(sync.snapshot().status,"conflict");
 assert.deepEqual(sync.snapshot().dirty,["Noël"]);
});
test("successful save clears dirty flag and retains server revision",async()=>{
 const sync=createTillSyncController({list:async()=>[],save:async()=> "2026-11-17T12:01:00Z"});
 sync.edit("Noël",menu);
 assert.equal(await sync.save("Noël"),true);
 assert.equal(sync.snapshot().status,"synced");
 assert.deepEqual(sync.snapshot().dirty,[]);
});

test("edit made while saving stays unsaved",async()=>{
 let finish;
 const pending=new Promise(resolve=>{finish=resolve});
 const sync=createTillSyncController({list:async()=>[],save:async()=>{await pending;return "2026-11-17T12:01:00Z"}});
 sync.edit("Noël",menu);
 const saving=sync.save("Noël");
 sync.edit("Noël",[{id:"vin-chaud",priceCents:500}]);
 finish();
 assert.equal(await saving,true);
 assert.deepEqual(sync.snapshot().dirty,["Noël"]);
 assert.equal(sync.snapshot().menus["Noël"][0].priceCents,500);
 assert.equal(sync.snapshot().status,"unsaved");
});
test("double tap cannot trigger duplicate save",async()=>{
 let finish;let calls=0;
 const pending=new Promise(resolve=>{finish=resolve});
 const sync=createTillSyncController({list:async()=>[],save:async()=>{calls++;await pending;return "2026-11-17T12:01:00Z"}});
 sync.edit("Noël",menu);
 const first=sync.save("Noël");
 assert.equal(await sync.save("Noël"),false);
 finish();await first;
 assert.equal(calls,1);
});
