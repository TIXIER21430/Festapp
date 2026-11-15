import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup} from "../src/lib/demoBackup.js";
import {planDemoRestore} from "../src/lib/demoRestore.js";

const row = id => ({id,values:["","",""]});

test("legacy restore preview rejects overflow without mutating input", () => {
  const current = {events:Array.from({length:10000},(_,i)=>row("existing-"+i))};
  const backup = createDemoBackup({events:[row("new")],contacts:[row("volunteer")]});
  assert.throws(()=>planDemoRestore(current,backup), TypeError);
  assert.equal(current.events.length,10000);
  assert.equal(current.contacts,undefined);
});

test("legacy restore preview permits exactly the category limit", () => {
  const current = {events:Array.from({length:9999},(_,i)=>row("existing-"+i))};
  const result = planDemoRestore(current,createDemoBackup({events:[row("last")]}));
  assert.equal(result.data.events.length,10000);
  assert.equal(result.added,1);
  assert.equal(current.events.length,9999);
});
