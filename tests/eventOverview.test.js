import test from "node:test";
import assert from "node:assert/strict";
import {eventOverview} from "../src/lib/eventOverview.js";
test("counts only explicit exact event field matches",()=>{
 const data={tasks:[{id:"1",values:["Installer le bar","Marché de Noël",""]},{id:"2",values:["Marché de Noël prochain","", ""]},{id:"3",values:["Autre","Fanfare",""]}]};
 const before=JSON.stringify(data);
 const result=eventOverview(data,"Marché de Noël");
 assert.equal(result.counts.tasks,1);
 assert.equal(result.unassigned.tasks,2);
 assert.equal(result.records.tasks[0].id,"1");
 assert.equal(JSON.stringify(data),before);
});
test("handles missing categories and accents",()=>{
 const result=eventOverview({finance:[{values:["Marché de Noël","120","recette"]}]},"marché de noël");
 assert.equal(result.counts.finance,1);
 assert.equal(result.counts.shopping,0);
});
test("rejects empty event name",()=>assert.throws(()=>eventOverview({}," "),TypeError));
