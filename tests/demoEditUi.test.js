import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const app=readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");
const cards=readFileSync(new URL("../src/RecordCardGrid.jsx",import.meta.url),"utf8");
test("edit action retains the original id and replaces the row rather than duplicating it",()=>{
 assert.match(app,/setEditingId\(record\.id\)/);
 assert.match(app,/id:editingId\|\|crypto\.randomUUID\(\)/);
 assert.match(app,/existing\.id===editingId\?withRecordEventId\(\{\.\.\.existing,values:row\.values/);
});
test("editing can be cancelled and is disabled in read-only recovery mode",()=>{
 assert.match(app,/function cancelEdit\(\)/);
 assert.match(app,/onClick=\{cancelEdit\}/);
 assert.match(app,/readOnly=\{demoReadOnly\} onEdit=\{beginEdit\}/);
 assert.match(cards,/onEdit\(selected\)/);
 assert.match(cards,/disabled=\{readOnly\}/);
});
test("switching module clears the pending edit",()=>{
 assert.match(app,/function openModule\(key,eventId=""\)/);
 assert.match(app,/setTab\(key\);setRecipeOutput\(""\);setContactType\("tous"\);setEditingId\(null\)/);
 assert.match(app,/onClick=\{\(\)=>openModule\(c\.key\)\}/);
});
test("ecocup edits recalculate balance excluding the old movement",()=>{
 assert.match(app,/data\.ecocups\|\|\[\]\)\.filter\(r=>r\.id!==editingId\)/);
});
