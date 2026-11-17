import test from "node:test";
import assert from "node:assert/strict";
import {suggestChecklistTasks} from "../src/lib/eventChecklist.js";
test("generic and event-specific tasks are proposed",()=>{
 const rows=suggestChecklistTasks("Marché de Noël","event1");
 assert.ok(rows.some(r=>r.values[0]==="Définir le budget"));
 assert.ok(rows.some(r=>r.values[0]==="Contacter les exposants"));
 assert.ok(rows.every(r=>r.eventId==="event1"&&r.done===false&&r.values.length===3));
});
test("existing tasks for the event are not duplicated, others do not interfere",()=>{
 const rows=suggestChecklistTasks("Carnaval","event1",[
 {eventId:"event1",values:["  définir le budget ","",""]},
 {eventId:"event2",values:["Répartir les bénévoles","",""]}
 ]);
 assert.ok(!rows.some(r=>r.values[0]==="Définir le budget"));
 assert.ok(rows.some(r=>r.values[0]==="Répartir les bénévoles"));
});
test("reject invalid event context",()=>{
 assert.throws(()=>suggestChecklistTasks("Carnaval",""));
 assert.throws(()=>suggestChecklistTasks("Carnaval","e",null));
});
