import test from "node:test";
import assert from "node:assert/strict";
import {eventOverview} from "../src/lib/eventOverview.js";
test("counts only tasks assigned to selected event",()=>{
 const data={tasks:[
 {id:"1",eventId:"e1",values:["Bar","Paul",""],done:true},
 {id:"2",eventId:"e1",values:["Tables","Julie",""],done:false},
 {id:"3",eventId:"e2",values:["Marché de Noël","",""],done:true},
 {id:"4",values:["Marché de Noël","",""],done:true}
 ]};
 const before=JSON.stringify(data);
 const result=eventOverview(data,"Marché de Noël","e1");
 assert.deepEqual(result.taskProgress,{total:3,done:2,remaining:1});
 assert.equal(JSON.stringify(data),before);
});
test("empty event has zero completion and remaining",()=>{
 assert.deepEqual(eventOverview({},"Fanfare","e3").taskProgress,{total:0,done:0,remaining:0});
});
