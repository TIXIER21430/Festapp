import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup} from "../src/lib/demoBackup.js";
import {createCombinedDemoBackup,inspectCombinedEcocupSettings,inspectCombinedVolunteerNeeds,mergeMissingVolunteerNeeds} from "../src/lib/combinedDemoBackup.js";
import {inspectEcocupBackup} from "../src/lib/ecocupBackupCheck.js";
const data={events:[{id:"event-1",values:["Carnaval","2027-02-01","Liernais"]}]};
test("combined file includes validated needs and still parses as existing backup",()=>{
 const json=createCombinedDemoBackup(data,{"event-1":{"🍹 Bar":3}});
 assert.deepEqual(inspectCombinedVolunteerNeeds(json),{present:true,needs:{"event-1":{"🍹 Bar":3}}});
});
test("old backup remains importable without needs",()=>{
 assert.deepEqual(inspectCombinedVolunteerNeeds(createDemoBackup(data)),{present:false,needs:{}});
});
test("restore adds only missing targets, never overwrites existing targets",()=>{
 assert.deepEqual(mergeMissingVolunteerNeeds({e1:{Bar:5}},{e1:{Bar:3,Cuisine:2}}),{e1:{Bar:5,Cuisine:2}});
});
test("reject malformed needs extension",()=>{
 const doc=JSON.parse(createDemoBackup(data));doc.volunteerNeeds={e1:{Bar:-5}};
 assert.throws(()=>inspectCombinedVolunteerNeeds(JSON.stringify(doc)));
});

test("combined backup preserves ecocup opening stock and alert threshold without touching inputs",()=>{
 const settings={openingBalance:"320",alertThreshold:"80"};
 const original=structuredClone(settings);
 const json=createCombinedDemoBackup(data,{},"2026-11-18T06:00:00.000Z",settings);
 assert.deepEqual(inspectCombinedEcocupSettings(json),{present:true,settings});
 assert.deepEqual(settings,original);
 assert.deepEqual(inspectCombinedVolunteerNeeds(json),{present:true,needs:{}});
});

test("old version-1 backups without ecocup settings remain accepted",()=>{
 assert.deepEqual(inspectCombinedEcocupSettings(createDemoBackup(data)),{present:false,settings:null});
 assert.deepEqual(inspectCombinedEcocupSettings(createCombinedDemoBackup(data,{})),{present:false,settings:null});
});

test("rejects invalid or unknown ecocup settings fields instead of silently normalizing them",()=>{
 for(const settings of [
  {openingBalance:"-1",alertThreshold:"10"},
  {openingBalance:1,alertThreshold:"10"},
  {openingBalance:"9007199254740992",alertThreshold:"1"},
  {openingBalance:"20",alertThreshold:"10",unexpected:"must-not-disappear"}
 ]){
  const doc=JSON.parse(createDemoBackup(data));
  doc.ecocupSettings=settings;
  assert.throws(()=>inspectCombinedEcocupSettings(JSON.stringify(doc)),TypeError);
 }
 assert.throws(()=>createCombinedDemoBackup(data,{},undefined,{openingBalance:"01",alertThreshold:"5"}),TypeError);
});

test("backup movements can be checked against exported stock and alert settings",()=>{
 const source={ecocups:[{id:"m1",values:["sortie","25","Carnaval"]}]};
 const json=createCombinedDemoBackup(source,{},undefined,{openingBalance:"40",alertThreshold:"20"});
 const {settings}=inspectCombinedEcocupSettings(json);
 const verified=inspectEcocupBackup(json,{openingBalance:Number(settings.openingBalance),alertThreshold:Number(settings.alertThreshold)});
 assert.deepEqual(verified,{valid:true,movementCount:1,balance:15,alert:true,minimumToClearAlert:6});
 assert.equal(inspectEcocupBackup(json,{openingBalance:0,alertThreshold:100}).valid,false);
});
