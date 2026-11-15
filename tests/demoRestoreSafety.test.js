import test from "node:test";
import assert from "node:assert/strict";
import { createDemoBackup, parseDemoBackup, validateDemoData } from "../src/lib/demoBackup.js";
import { planDemoRestore } from "../src/lib/demoRestorePlan.js";

const row = (id, value = "valeur") => ({ id, values: [value, "", ""] });

test("restore preview remains read-only for every supported demo category", () => {
  const categories = ["events", "tasks", "shopping", "stock", "ecocups", "contacts", "shifts", "feedback", "recipes", "finance"];
  const current = Object.fromEntries(categories.map(category => [category, [row("existing", "original")]]));
  const incoming = Object.fromEntries(categories.map(category => [category, [row("new", "à importer")]]));
  const snapshot = JSON.stringify(current);
  const backup = createDemoBackup(incoming, "2026-11-15T07:00:00.000Z");
  const plan = planDemoRestore(current, backup);
  assert.equal(plan.safeToAppend, true);
  for (const category of categories) {
    assert.equal(plan.counts[category].addable, 1);
    assert.deepEqual(plan.additions[category], incoming[category]);
  }
  assert.equal(JSON.stringify(current), snapshot);
  assert.deepEqual(parseDemoBackup(backup), incoming);
});

test("invalid records and duplicate IDs fail closed before any restore planning", () => {
  const invalid = [
    { events: [row("same"), row("same")] },
    { events: [{ id: "", values: ["", "", ""] }] },
    { contacts: [{ id: "x", values: ["", "", 12] }] },
    { events: [{ id: "x", values: ["", ""] }] },
    { unexpected: [row("x")] },
  ];
  for (const data of invalid) {
    assert.throws(() => validateDemoData(data), TypeError);
    assert.throws(() => createDemoBackup(data), TypeError);
  }
  const valid = createDemoBackup({ events: [row("ok")] });
  assert.throws(() => planDemoRestore({ events: [row("same"), row("same")] }, valid), TypeError);
});

test("oversized or unsupported backups cannot be previewed", () => {
  assert.throws(() => parseDemoBackup(" ".repeat(10_000_001)), TypeError);
  const parsed = JSON.parse(createDemoBackup({ events: [row("one")] }));
  parsed.version += 1;
  assert.throws(() => planDemoRestore({}, JSON.stringify(parsed)), TypeError);
});
