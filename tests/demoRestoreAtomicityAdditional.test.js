import test from "node:test";
import assert from "node:assert/strict";
import { createDemoBackup } from "../src/lib/demoBackup.js";
import { planDemoRestore } from "../src/lib/demoRestorePlan.js";
import { mergeDemoBackupWithoutOverwrite } from "../src/lib/demoRestoreMerge.js";

const row = (id, value = "") => ({ id, values: [value, "", ""] });

test("restore refuses an invalid backup without changing existing records", () => {
  const current = { events: [row("event-1", "Existing")], contacts: [row("person-1", "Existing contact")] };
  const snapshot = structuredClone(current);
  const valid = JSON.parse(createDemoBackup({ events: [row("event-2")] }));
  valid.data.events[0].values = ["wrong length"];
  const malformed = JSON.stringify(valid);
  assert.throws(() => planDemoRestore(current, malformed), TypeError);
  assert.throws(() => mergeDemoBackupWithoutOverwrite(current, malformed), TypeError);
  assert.deepEqual(current, snapshot);
});

test("a conflict in one category prevents additions in every category", () => {
  const current = { events: [row("event-1", "Original")], contacts: [row("person-1", "Original")] };
  const snapshot = structuredClone(current);
  const backup = createDemoBackup({
    events: [row("event-1", "Attempted overwrite")],
    contacts: [row("person-2", "New")]
  });
  const plan = planDemoRestore(current, backup);
  assert.equal(plan.safeToAppend, false);
  assert.deepEqual(plan.conflicts, [{ category: "events", id: "event-1" }]);
  assert.equal(plan.counts.contacts.addable, 1);
  assert.throws(() => mergeDemoBackupWithoutOverwrite(current, backup), error =>
    error.code === "DEMO_RESTORE_CONFLICT" && error.conflicts.length === 1);
  assert.deepEqual(current, snapshot);
});
