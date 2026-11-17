import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createDemoBackup,parseDemoBackup,validateDemoData} from "../src/lib/demoBackup.js";
test("task completion survives backup without losing details",()=>{
 const row={id:"t1",values:["Installer le bar","Alice","Vendredi"],eventId:"event1",done:true};
 assert.deepEqual(parseDemoBackup(createDemoBackup({tasks:[row]})).tasks[0],row);
});
test("task completion rejects wrong types and other modules",()=>{
 assert.throws(()=>validateDemoData({tasks:[{id:"t1",values:["","",""],done:"yes"}]}),TypeError);
 assert.throws(()=>validateDemoData({finance:[{id:"f1",values:["","",""],done:true}]}),TypeError);
});
test("task checkbox is interactive but disabled in recovery mode",()=>{
 const app=readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");
 assert.match(app,/checked=\{r\.done===true\} disabled=\{demoReadOnly\}/);
 assert.match(app,/onChange=\{\(\)=>toggleTaskDone\(r\.id\)\}/);
});
