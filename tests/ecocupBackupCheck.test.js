import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup} from "../src/lib/demoBackup.js";
import {inspectEcocupBackup} from "../src/lib/ecocupBackupCheck.js";

test("backup écocups valide : calcul et alerte en lecture seule",()=>{
 const json=createDemoBackup({ecocups:[{id:"a",values:["sortie","3","Carnaval"]}]},"2026-11-15T00:00:00Z");
 assert.deepEqual(inspectEcocupBackup(json,{openingBalance:10,alertThreshold:8}),
  {valid:true,movementCount:1,balance:7,alert:true,minimumToClearAlert:2});
});
test("backup avec sortie impossible est signalé sans restauration",()=>{
 const json=createDemoBackup({ecocups:[{id:"a",values:["sortie","5","Fête"]}]});
 assert.deepEqual(inspectEcocupBackup(json,{openingBalance:2,alertThreshold:1}),
  {valid:false,movementCount:1,reason:"negative-or-overflow-stock"});
});
test("backup avec mouvement mal formé est signalé",()=>{
 const json=createDemoBackup({ecocups:[{id:"a",values:["sortie","0","Fête"]}]});
 assert.equal(inspectEcocupBackup(json,{openingBalance:10}).reason,"invalid-movement-or-settings");
});
test("backup sans écocups est accepté, source inchangée",()=>{
 const json=createDemoBackup({events:[{id:"x",values:["Fête","",""]}]});
 assert.equal(inspectEcocupBackup(json,{openingBalance:4}).balance,4);
 assert.equal(inspectEcocupBackup(json,{openingBalance:4}).movementCount,0);
});
test("format de sauvegarde invalide est refusé",()=>{
 assert.throws(()=>inspectEcocupBackup('{"bad":true}',{openingBalance:0}));
});
