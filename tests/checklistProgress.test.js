import test from "node:test";
import assert from "node:assert/strict";
import {checklistProgress} from "../src/lib/checklistProgress.js";
test("phase progress is scoped to the chosen event",()=>{
 const rows=[{id:"a",eventId:"x",values:["Installer","", "Veille"],done:true},{id:"b",eventId:"x",values:["Préparer","", "Veille"],done:false},{id:"c",eventId:"y",values:["Autre","", "Veille"],done:true}];
 const result=checklistProgress(rows,"x",["Avant","Veille"]);
 assert.deepEqual(result.map(x=>[x.phase,x.total,x.done,x.remaining]),[["Avant",0,0,0],["Veille",2,1,1]]);
 assert.equal(rows.length,3);
});
test("invalid inputs are rejected",()=>assert.throws(()=>checklistProgress(null,"x",[])));

test("new phase metadata and legacy phase field both remain visible",()=>{
 const rows=[{id:"new",eventId:"e",phase:"Veille",values:["Préparer","","2026-12-01"],done:false},{id:"old",eventId:"e",values:["Ranger","","Veille"],done:true}];
 const result=checklistProgress(rows,"e",["Veille"]);
 assert.equal(result[0].total,2);
 assert.equal(result[0].done,1);
});
