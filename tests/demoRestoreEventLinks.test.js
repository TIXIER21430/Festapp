import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createDemoBackup} from "../src/lib/demoBackup.js";
import {planDemoRestore} from "../src/lib/demoRestorePlan.js";
import {applyDemoRestore} from "../src/lib/applyDemoRestore.js";

const row=(id,name,eventId)=>({id,values:[name,"",""],...(eventId===undefined?{}:{eventId})});

test("incoming task with missing event is blocked before any partial append",()=>{
 const current={events:[row("existing","Carnaval")],contacts:[row("c1","Exposant")]};
 const snapshot=JSON.stringify(current);
 const backup=createDemoBackup({tasks:[row("t2","Prévoir le bar","missing-event")],contacts:[row("c2","Bénévole")]});
 const plan=planDemoRestore(current,backup);
 assert.equal(plan.safeToAppend,false);
 assert.deepEqual(plan.danglingLinks,[{category:"tasks",id:"t2",eventId:"missing-event"}]);
 assert.equal(plan.counts.contacts.addable,1);
 assert.throws(()=>applyDemoRestore(current,backup,{confirmed:true}),/blocked/);
 assert.equal(JSON.stringify(current),snapshot);
});

test("links to a current event or one included in the same backup are accepted",()=>{
 const current={events:[row("existing","Carnaval")]};
 const backup=createDemoBackup({tasks:[row("t1","Imprimer affiches","existing"),row("t2","Préparer scène","new")],shifts:[row("s1","Élodie","new")],events:[row("new","Fanfare")]});
 const plan=planDemoRestore(current,backup);
 assert.deepEqual(plan.danglingLinks,[]);
 assert.equal(plan.safeToAppend,true);
 const result=applyDemoRestore(current,backup,{confirmed:true});
 assert.equal(result.events.length,2);
 assert.equal(result.tasks[1].eventId,"new");
 assert.equal(result.shifts[0].eventId,"new");
});

test("old orphaned links remain untouched; unassigned incoming records remain allowed",()=>{
 const current={tasks:[row("old","Historique","old-missing")]};
 const backup=createDemoBackup({tasks:[row("new","À attribuer","")],contacts:[row("c","Groupe")]});
 const plan=planDemoRestore(current,backup);
 assert.equal(plan.safeToAppend,true);
 assert.deepEqual(plan.danglingLinks,[]);
 const result=applyDemoRestore(current,backup,{confirmed:true});
 assert.equal(result.tasks[0].eventId,"old-missing");
 assert.equal(result.tasks[1].eventId,"");
});

test("preview labels orphan event links without exposing contact details",()=>{
 const app=readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");
 assert.match(app,/plan\.danglingLinks\.length/);
 assert.match(app,/lien\(s\) vers des manifestations absentes/);
 assert.match(app,/plan\.safeToAppend && ecocupSafe|plan\.safeToAppend&&ecocupSafe/);
});
