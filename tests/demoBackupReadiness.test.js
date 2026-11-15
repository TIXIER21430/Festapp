import test from "node:test";
import assert from "node:assert/strict";
import { createDemoBackup } from "../src/lib/demoBackup.js";
import { inspectDemoBackupReadiness } from "../src/lib/demoBackupReadiness.js";

test("reports missing and empty categories without returning personal details", () => {
  const json = createDemoBackup({
    events: [{id:"e1", values:["Marché de Noël","",""]}],
    tasks: [],
    contacts: [{id:"c1", values:["Test","secret@example.org","0600000000"]}],
  });
  const report = inspectDemoBackupReadiness(json);
  assert.deepEqual(report.missingCategories, ["ecocups"]);
  assert.deepEqual(report.emptyCategories, ["tasks"]);
  assert.equal(report.recordCount, 2);
  assert.equal(report.hasContactData, true);
  assert.equal(report.canRestoreToSharedDatabase, false);
  assert.equal(report.requiresHumanReview, true);
  assert.equal(JSON.stringify(report).includes("secret@example.org"), false);
});

test("rejects invalid backup without attempting repair", () => {
  assert.throws(() => inspectDemoBackupReadiness("{}"), TypeError);
});
