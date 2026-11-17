import test from "node:test";
import assert from "node:assert/strict";
import {DRIVE_CHECKLISTS,suggestDriveChecklistTasks} from "../src/lib/eventChecklist.js";
test("three real Drive checklists are available",()=>{
 for(const name of ["Marché de Noël","Saint-Laurent","Fanfare"]){
  assert.ok(DRIVE_CHECKLISTS[name].source.startsWith("https://docs.google.com/"));
  assert.ok(suggestDriveChecklistTasks(name,"e1").length>35);
 }
});
test("real phases and event links are preserved",()=>{
 const tasks=suggestDriveChecklistTasks("Marché de Noël","e1");
 assert.ok(tasks.some(t=>t.values[0]==="Préparer la pate à crêpe"&&t.values[2]==="Veille"));
 assert.ok(tasks.some(t=>t.values[0]==="Chercher pain"&&t.values[2].startsWith("Jour J")));
 assert.ok(tasks.every(t=>t.eventId==="e1"&&t.done===false));
});
test("importing again does not duplicate tasks for same event",()=>{
 const first=suggestDriveChecklistTasks("Fanfare","e1");
 assert.equal(suggestDriveChecklistTasks("Fanfare","e1",first).length,0);
 assert.equal(suggestDriveChecklistTasks("Fanfare","e2",first).length,first.length);
});
