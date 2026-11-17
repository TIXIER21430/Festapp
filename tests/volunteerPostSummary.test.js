import test from "node:test";
import assert from "node:assert/strict";
import {volunteerPostSummary} from "../src/lib/volunteerPostSummary.js";
test("counts only selected event and keeps unknown roles visible",()=>{
 const rows=[{eventId:"e1",values:["A","10:00-12:00","🍹 Bar"]},{eventId:"e1",values:["B","11:00-12:00","🍹 Bar"]},{eventId:"e1",values:["C","12:00-14:00","Autre"]},{eventId:"e1",values:["D","12:00-14:00",""]},{eventId:"e2",values:["E","10:00-12:00","🍹 Bar"]}];
 const before=JSON.stringify(rows);
 assert.deepEqual(volunteerPostSummary(rows,"e1",["🍹 Bar","🍳 Cuisine"]),{posts:[{post:"🍹 Bar",count:2},{post:"🍳 Cuisine",count:0}],other:1,unassigned:1,total:4});
 assert.equal(JSON.stringify(rows),before);
});
test("empty data gives zero counts",()=>assert.deepEqual(volunteerPostSummary([],"e1",["Bar"]),{posts:[{post:"Bar",count:0}],other:0,unassigned:0,total:0}));
