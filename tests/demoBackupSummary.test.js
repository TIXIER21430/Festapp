import test from "node:test";
import assert from "node:assert/strict";
import { createDemoBackup } from "../src/lib/demoBackup.js";
import { summarizeDemoBackup } from "../src/lib/demoBackupSummary.js";

test("summarizes offline categories without exposing contact details", () => {
  const backup = createDemoBackup({
    contacts: [{ id: "person-1", values: ["Name", "email@example.org", "0600000000"] }],
    events: [{ id: "event-1", values: ["Fête", "", ""] }],
    ecocups: [],
  });
  const result = summarizeDemoBackup(backup);
  assert.deepEqual(result.categories, [
    { name: "contacts", count: 1 },
    { name: "events", count: 1 },
    { name: "ecocups", count: 0 },
  ]);
  assert.equal(result.totalRecords, 2);
  assert.equal(result.containsContacts, true);
  assert.equal(result.restoreRequiresExplicitApproval, true);
  assert.equal(result.sharedDatabaseCompatible, false);
  assert.equal(JSON.stringify(result).includes("email@example.org"), false);
});

test("rejects unsupported backup instead of showing misleading totals", () => {
  assert.throws(() => summarizeDemoBackup('{"format":"unknown"}'), TypeError);
});
