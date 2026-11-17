import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const app=readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");
test("edit action retains the original id and replaces the row rather than duplicating it",()=>{
 assert.match(app,/setEditingId\(record\.id\)/);
 assert.match(app,/id:editingId\|\|crypto\.randomUUID\(\)/);
 assert.match(app,/existing\.id===editingId\?\{\.\.\.existing,values:row\.values\}:existing/);
});
test("editing can be cancelled and is disabled in read-only recovery mode",()=>{
 assert.match(app,/function cancelEdit\(\)/);
 assert.match(app,/onClick=\{cancelEdit\}/);
 assert.match(app,/disabled=\{demoReadOnly\} onClick=\{\(\)=>beginEdit\(r\)\}/);
});
test("switching module clears the pending edit",()=>{
 assert.match(app,/setTab\(c\.key\);setRecipeOutput\(""\);setContactType\("tous"\);setEditingId\(null\)/);
});
test("ecocup edits recalculate balance excluding the old movement",()=>{
 assert.match(app,/data\.ecocups\|\|\[\]\)\.filter\(r=>r\.id!==editingId\)/);
});
