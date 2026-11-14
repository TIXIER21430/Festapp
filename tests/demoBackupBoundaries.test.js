import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup, parseDemoBackup, previewDemoBackup} from "../src/lib/demoBackup.js";

const backup = data => JSON.stringify({
  format:"festapp-demo-backup", version:1,
  exportedAt:"2026-11-14T07:00:00.000Z", data
});
const record = (id, values=["a","b","c"]) => ({id,values});

test("empty backup is valid and has zero records", () => {
  assert.deepEqual(previewDemoBackup(backup({})), {categories:0,records:0,data:{}});
});
test("preview does not change existing local data", () => {
  const existing={events:[record("original")]};
  const snapshot=JSON.stringify(existing);
  const imported=previewDemoBackup(backup({events:[record("new")]}));
  assert.equal(JSON.stringify(existing),snapshot);
  assert.equal(imported.data.events[0].id,"new");
});
test("reject arrays, null and scalar data containers", () => {
  for(const data of [null,[],3,"x"]) assert.throws(()=>parseDemoBackup(backup(data)));
});
test("reject missing, malformed or duplicate identifiers", () => {
  for(const rows of [[record("")],[{values:["a","b","c"]}],[record("same"),record("same")]])
    assert.throws(()=>parseDemoBackup(backup({events:rows})));
});
test("reject non-string values and excess field lengths", () => {
  for(const values of [["a",null,"c"],["a",42,"c"],["a","b","x".repeat(20001)]])
    assert.throws(()=>parseDemoBackup(backup({contacts:[record("a",values)]})));
});
test("reject oversized JSON before parsing", () => {
  assert.throws(()=>parseDemoBackup(" ".repeat(10_000_001)),TypeError);
});
test("reject invalid timestamp and version", () => {
  assert.throws(()=>parseDemoBackup(backup({}).replace("2026-11-14T07:00:00.000Z","not-a-date")));
  assert.throws(()=>parseDemoBackup(backup({}).replace('"version":1','"version":2')));
});
test("backup creation copies record values rather than sharing mutable arrays", () => {
  const source={events:[record("one")]};
  const parsed=parseDemoBackup(createDemoBackup(source));
  parsed.events[0].values[0]="changed";
  assert.equal(source.events[0].values[0],"a");
});
