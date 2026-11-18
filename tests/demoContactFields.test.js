import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup,parseDemoBackup,validateDemoData} from "../src/lib/demoBackup.js";
import {applyDemoRestore} from "../src/lib/applyDemoRestore.js";
import {planDemoRestore} from "../src/lib/demoRestorePlan.js";

const detailed={id:"c1",values:["Élodie","bénévole","Ancien contact : 06 03 00 00 00"],email:"elodie@example.fr",phone:"06 04 05 06 07"};

test("backup and non-overwriting restore preserve both typed fields and the legacy free text",()=>{
 const original={contacts:[structuredClone(detailed)]};
 const backup=createDemoBackup(original);
 assert.deepEqual(parseDemoBackup(backup),original);
 const plan=planDemoRestore({},backup);
 assert.deepEqual(plan.additions.contacts,[detailed]);
 const restored=applyDemoRestore({},backup,{confirmed:true});
 assert.deepEqual(restored.contacts,[detailed]);
 restored.contacts[0].email="changed@example.fr";
 assert.equal(original.contacts[0].email,"elodie@example.fr");
});

test("older backup records with only three values stay unchanged",()=>{
 const old={contacts:[{id:"old",values:["Fanfare","groupe","06 01 02 03 04"]}]};
 assert.deepEqual(parseDemoBackup(createDemoBackup(old)),old);
 assert.deepEqual(applyDemoRestore({},createDemoBackup(old),{confirmed:true}),old);
});

test("contact fields are rejected on unrelated modules and invalid contact types",()=>{
 assert.throws(()=>validateDemoData({events:[{...detailed}]}),TypeError);
 assert.throws(()=>validateDemoData({contacts:[{...detailed,email:42}]}),TypeError);
 assert.throws(()=>validateDemoData({contacts:[{...detailed,phone:"0".repeat(65)}]}),TypeError);
});
