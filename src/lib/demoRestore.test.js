import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup} from "./demoBackup.js";
import {planDemoRestore} from "./demoRestore.js";

const row=(id,value)=>({id,values:[value,"",""]});
test("restoration is only a plan and preserves existing records",()=>{
 const current={events:[row("a","local")]};
 const result=planDemoRestore(current,createDemoBackup({events:[row("a","remote"),row("b","new")]}));
 assert.deepEqual(current,{events:[row("a","local")]});
 assert.deepEqual(result.data.events,[row("a","local"),row("b","new")]);
 assert.deepEqual(result.conflicts,[{category:"events",id:"a"}]);
 assert.equal(result.added,1);
 assert.equal(result.requiresConfirmation,true);
});
test("repeated restore is idempotent",()=>{
 const backup=createDemoBackup({contacts:[row("x","Alice")]});
 const first=planDemoRestore({},backup);
 const second=planDemoRestore(first.data,backup);
 assert.equal(second.added,0);
 assert.deepEqual(second.data,first.data);
});
test("rejects incompatible backup without modifying current",()=>{
 const current={tasks:[row("t","Faire")]};
 assert.throws(()=>planDemoRestore(current,'{"format":"other"}'));
 assert.equal(current.tasks[0].values[0],"Faire");
});
