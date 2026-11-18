import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup} from "../src/lib/demoBackup.js";
import {createCombinedDemoBackup} from "../src/lib/combinedDemoBackup.js";

test("a combined backup cannot exceed the importer UTF-8 limit after appending staffing needs", () => {
  const data={contacts:Array.from({length:500},(_,i)=>({
    id:`synthetic-${i}`,values:["x".repeat(19800),"",""]
  }))};
  const basic=createDemoBackup(data);
  assert.ok(new TextEncoder().encode(basic).byteLength<10_000_000);
  const needs=Object.fromEntries(Array.from({length:600},(_,i)=>[
    `demo-${i}-${"a".repeat(172)}`, {Bar:1}
  ]));
  assert.throws(()=>createCombinedDemoBackup(data,needs),{
    name:"RangeError",message:"Backup too large to restore"
  });
});
