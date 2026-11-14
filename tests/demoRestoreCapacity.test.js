import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup} from "../src/lib/demoBackup.js";
import {planDemoRestore} from "../src/lib/demoRestorePlan.js";
import {mergeDemoBackupWithoutOverwrite} from "../src/lib/demoRestoreMerge.js";

const row = id => ({id,values:["","",""]});

test("preview blocks category overflow before attempting restore", () => {
  const current = {events:Array.from({length:10000},(_,i)=>row("existing-"+i))};
  const backup = createDemoBackup({events:[row("incoming")],contacts:[row("volunteer")]});
  const plan = planDemoRestore(current,backup);
  assert.equal(plan.safeToAppend,false);
  assert.deepEqual(plan.capacityExceeded,[{category:"events",finalCount:10001,maximum:10000}]);
  assert.equal(plan.conflicts.length,0);
  assert.equal(plan.counts.contacts.addable,1);
  assert.equal(current.events.length,10000);
  assert.throws(()=>mergeDemoBackupWithoutOverwrite(current,backup),err =>
    err.code==="DEMO_RESTORE_CONFLICT" && err.capacityExceeded.length===1);
  assert.equal(current.events.length,10000);
  assert.equal(current.contacts,undefined);
});

test("preview allows exactly 10000 records per category", () => {
  const current={events:Array.from({length:9999},(_,i)=>row("existing-"+i))};
  const backup=createDemoBackup({events:[row("last")]});
  const plan=planDemoRestore(current,backup);
  assert.equal(plan.safeToAppend,true);
  assert.deepEqual(plan.capacityExceeded,[]);
  assert.equal(mergeDemoBackupWithoutOverwrite(current,backup).events.length,10000);
});
