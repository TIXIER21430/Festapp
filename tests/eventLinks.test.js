import test from "node:test";
import assert from "node:assert/strict";
import {validateDemoData,createDemoBackup,parseDemoBackup} from "../src/lib/demoBackup.js";
import {eventOverview} from "../src/lib/eventOverview.js";
test("event association survives local backup roundtrip",()=>{
 const data={events:[{id:"event-1",values:["Marché de Noël","",""]}],tasks:[{id:"task-1",values:["Installer les tables","Paul","demain"],eventId:"event-1"}]};
 assert.deepEqual(parseDemoBackup(createDemoBackup(data)).tasks[0],data.tasks[0]);
});
test("explicit event ID takes precedence over matching text",()=>{
 const data={tasks:[{id:"task-1",values:["Marché de Noël","Paul",""],eventId:"event-2"}]};
 assert.equal(eventOverview(data,"Marché de Noël","event-1").counts.tasks,0);
 assert.equal(eventOverview(data,"Marché de Noël","event-2").counts.tasks,1);
});
test("invalid event link fails closed",()=>{
 assert.throws(()=>validateDemoData({tasks:[{id:"a",values:["","",""],eventId:23}]}),TypeError);
});
