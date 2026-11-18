import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup} from "../src/lib/demoBackup.js";
import {planDemoRestore} from "../src/lib/demoRestorePlan.js";
import {applyDemoRestore} from "../src/lib/applyDemoRestore.js";
import {mergeDemoBackupWithoutOverwrite} from "../src/lib/demoRestoreMerge.js";

const checklistTask = {
  id: "task-noel-1",
  values: ["Préparer la buvette", "Alice", "2026-12-12"],
  eventId: "event-noel-2026",
  phase: "Veille",
  done: true
};

test("preview and both restore paths preserve checklist phase, completion and event link", () => {
  const existing = {events:[{id:"event-noel-2026",values:["Marché de Noël 2026", "2026-12-13", "Liernais"]}]};
  const original = structuredClone(existing);
  const saved = structuredClone(checklistTask);
  const backup = createDemoBackup({tasks:[saved]});
  const plan = planDemoRestore(existing,backup);
  assert.equal(plan.safeToAppend,true);
  assert.deepEqual(plan.additions.tasks,[checklistTask]);
  const restored = applyDemoRestore(existing,backup,{confirmed:true});
  const merged = mergeDemoBackupWithoutOverwrite(existing,backup);
  assert.deepEqual(restored.tasks,[checklistTask]);
  assert.deepEqual(merged.tasks,[checklistTask]);
  assert.deepEqual(existing,original);

  plan.additions.tasks[0].values[0] = "Détaché";
  restored.tasks[0].values[0] = "Modifié";
  merged.tasks[0].values[0] = "Modifié autrement";
  assert.deepEqual(saved,checklistTask);
});

test("restores legacy tasks without manufacturing missing metadata", () => {
  const oldTask={id:"legacy-task",values:["Installer les tables","","Veille"]};
  const data=applyDemoRestore({},createDemoBackup({tasks:[oldTask]}),{confirmed:true});
  assert.deepEqual(data.tasks,[oldTask]);
  assert.equal(Object.hasOwn(data.tasks[0],"phase"),false);
  assert.equal(Object.hasOwn(data.tasks[0],"done"),false);
  assert.equal(Object.hasOwn(data.tasks[0],"eventId"),false);
});

test("one conflicting task blocks whole import and preserves existing checklist metadata", () => {
  const original=structuredClone(checklistTask);
  const current={tasks:[original]};
  const backup=createDemoBackup({tasks:[{...checklistTask,phase:"Jour J",done:false}],contacts:[{id:"new",values:["Bénévole","bénévole",""]}]});
  assert.equal(planDemoRestore(current,backup).safeToAppend,false);
  assert.throws(()=>applyDemoRestore(current,backup,{confirmed:true}),/blocked/);
  assert.deepEqual(current.tasks,[checklistTask]);
  assert.equal(current.contacts,undefined);
});
