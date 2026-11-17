import test from "node:test";
import assert from "node:assert/strict";
import {volunteerSchedule} from "../src/lib/volunteerSchedule.js";
test("chronological shifts are isolated by event and preserve input",()=>{
 const rows=[
 {id:"late",eventId:"e1",values:["Alice","14:00-16:00","Bar"]},
 {id:"other",eventId:"e2",values:["Bob","09:00-10:00","Cuisine"]},
 {id:"early",eventId:"e1",values:["Claire","09:00-11:00","Accueil"]},
 {id:"missing",eventId:"e1",values:["David","","Installation"]}
 ];
 const before=JSON.stringify(rows);
 const schedule=volunteerSchedule(rows,"e1");
 assert.equal(schedule.total,3);
 assert.deepEqual(schedule.scheduled.map(r=>r.id),["early","late"]);
 assert.deepEqual(schedule.unscheduled.map(r=>r.id),["missing"]);
 assert.equal(JSON.stringify(rows),before);
});
test("no event selected shows no volunteer assignments",()=>assert.equal(volunteerSchedule([{id:"a",values:["A","10:00-11:00","Bar"]}],"e1").total,0));
