import test from "node:test";
import assert from "node:assert/strict";
import { createDemoBackup } from "../src/lib/demoBackup.js";
import { planDemoRestore } from "../src/lib/demoRestorePlan.js";

const row = (id, value="x") => ({ id, values:[value,"",""] });

test("plans nonconflicting additions across modules without changing current data", () => {
  const current = {events:[row("one")]};
  const before = JSON.stringify(current);
  const plan = planDemoRestore(current, createDemoBackup({events:[row("two")],contacts:[row("c1")]}));
  assert.equal(plan.safeToAppend,true);
  assert.equal(plan.counts.events.addable,1);
  assert.equal(plan.counts.contacts.addable,1);
  assert.equal(JSON.stringify(current),before);
});
test("reports identifier collisions without overwriting records", () => {
  const plan = planDemoRestore({events:[row("one","original")]},
    createDemoBackup({events:[row("one","new"),row("two")]}));
  assert.equal(plan.safeToAppend,false);
  assert.deepEqual(plan.conflicts,[{category:"events",id:"one"}]);
  assert.deepEqual(plan.additions.events,[row("two")]);
});
test("same identifier in different modules is not a collision", () => {
  const plan = planDemoRestore({events:[row("same")]},createDemoBackup({contacts:[row("same")]}));
  assert.equal(plan.safeToAppend,true);
});
test("returned additions are detached from existing objects", () => {
  const current={events:[row("one")]};
  const plan=planDemoRestore(current,createDemoBackup({events:[row("two")]}));
  plan.additions.events[0].values[0]="changed";
  assert.equal(current.events[0].values[0],"x");
});
test("rejects invalid current data and malformed backups", () => {
  assert.throws(()=>planDemoRestore({events:[{id:"bad"}]},createDemoBackup({})));
  assert.throws(()=>planDemoRestore({},'{bad json'));
});
