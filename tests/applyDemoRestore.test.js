import test from "node:test";
import assert from "node:assert/strict";
import { createDemoBackup } from "../src/lib/demoBackup.js";
import { applyDemoRestore } from "../src/lib/applyDemoRestore.js";

const row = (id, name) => ({id, values:[name, "", ""]});

test("requires explicit confirmation and never modifies existing data", () => {
  const current = {events:[row("e1","Carnaval")]};
  const backup = createDemoBackup({contacts:[row("c1","Benevole")]});
  const before = JSON.stringify(current);
  assert.throws(() => applyDemoRestore(current, backup), /confirmation/);
  const restored = applyDemoRestore(current, backup, {confirmed:true});
  assert.deepEqual(restored.events, current.events);
  assert.deepEqual(restored.contacts, [row("c1","Benevole")]);
  restored.events[0].values[0] = "changed";
  assert.equal(JSON.stringify(current), before);
});

test("rejects conflicts atomically without partial restoration", () => {
  const current = {events:[row("e1","Original")]};
  const backup = createDemoBackup({events:[row("e1","Replacement")],contacts:[row("c1","Volunteer")]});
  assert.throws(() => applyDemoRestore(current, backup, {confirmed:true}), /blocked/);
  assert.deepEqual(current.events,[row("e1","Original")]);
});

test("rejects malformed backup even with confirmation", () => {
  assert.throws(() => applyDemoRestore({}, "{broken", {confirmed:true}));
});

test("retains unrelated modules and allows empty backup", () => {
  const current = {tasks:[row("t1","Setup")]};
  assert.deepEqual(applyDemoRestore(current, createDemoBackup({}), {confirmed:true}),current);
});
