import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup} from "../src/lib/demoBackup.js";
import {mergeDemoBackupWithoutOverwrite} from "../src/lib/demoRestoreMerge.js";
const row=(id,value="x")=>({id,values:[value,"",""]});

test("append new records in existing and new categories",()=>{
  const current={events:[row("old")]};
  const result=mergeDemoBackupWithoutOverwrite(current,createDemoBackup({events:[row("new")],contacts:[row("contact")]}));
  assert.deepEqual(result.events,[row("old"),row("new")]);
  assert.deepEqual(result.contacts,[row("contact")]);
  assert.deepEqual(current,{events:[row("old")]});
});
test("conflict in one category aborts entire restore without mutation",()=>{
  const current={events:[row("old","original")]};
  const backup=createDemoBackup({events:[row("old","replacement")],contacts:[row("would-add")]});
  const before=JSON.stringify(current);
  assert.throws(()=>mergeDemoBackupWithoutOverwrite(current,backup),error=>
    error.code==="DEMO_RESTORE_CONFLICT" && error.conflicts.length===1);
  assert.equal(JSON.stringify(current),before);
});
test("same ID in different categories is permitted",()=>{
  const result=mergeDemoBackupWithoutOverwrite({events:[row("same")]},createDemoBackup({contacts:[row("same")]}));
  assert.equal(result.contacts[0].id,"same");
});
test("merged output has independent values arrays",()=>{
  const current={events:[row("old")]};
  const result=mergeDemoBackupWithoutOverwrite(current,createDemoBackup({events:[row("new")]}));
  result.events[0].values[0]="changed";
  assert.equal(current.events[0].values[0],"x");
});
test("reject malformed backup before merging",()=>{
  assert.throws(()=>mergeDemoBackupWithoutOverwrite({events:[row("old")]},"not json"));
});
