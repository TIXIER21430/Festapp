import test from "node:test";
import assert from "node:assert/strict";
import {planNextEdition} from "../src/lib/eventEdition.js";
const events=[{id:"e1",values:["Fanfare","2026-06-01","Place du village"]}];
const tasks=[{id:"t1",eventId:"e1",values:["Prévenir la mairie","Céline","Avant"],done:true},{id:"t2",eventId:"other",values:["Autre","",""],done:false}];
test("new edition resets tasks, dates and assignees without changing source",()=>{
 const result=planNextEdition(events,tasks,"e1",2027);
 assert.deepEqual(result.eventValues,["Fanfare 2027","","Place du village"]);
 assert.deepEqual(result.tasks,[{values:["Prévenir la mairie","","Avant"],done:false}]);
 assert.equal(tasks[0].done,true);
 assert.equal(tasks[0].values[1],"Céline");
});
test("duplicate annual edition is rejected",()=>assert.throws(()=>planNextEdition([...events,{id:"e2",values:["Fanfare 2027","",""]}],tasks,"e1",2027)));
test("invalid year is rejected",()=>assert.throws(()=>planNextEdition(events,tasks,"e1","next")));
