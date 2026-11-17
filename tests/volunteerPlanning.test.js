import test from "node:test";
import assert from "node:assert/strict";
import {parseShiftSlot,findVolunteerConflicts} from "../src/lib/volunteerPlanning.js";
test("parses same-day volunteer slots safely",()=>{
 assert.deepEqual(parseShiftSlot("09:00-12:30"),{start:540,end:750});
 assert.equal(parseShiftSlot("23:00-01:00"),null);
 assert.equal(parseShiftSlot("demain matin"),null);
});
test("flags overlapping shifts only for same volunteer and event",()=>{
 const rows=[{id:"a",eventId:"e1",values:["Alice","10:00-12:00","Bar"]},{id:"b",eventId:"e2",values:["Alice","10:00-12:00","Cuisine"]}];
 assert.deepEqual(findVolunteerConflicts(rows,{eventId:"e1",values:["alice","11:00-13:00","Accueil"]}).map(x=>x.id),["a"]);
 assert.deepEqual(findVolunteerConflicts(rows,{eventId:"e1",values:["Alice","12:00-14:00","Accueil"]}),[]);
 assert.deepEqual(findVolunteerConflicts(rows,{eventId:"e1",values:["Alice","11:00-13:00","Accueil"]},{excludeId:"a"}),[]);
});
