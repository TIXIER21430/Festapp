import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup} from "../src/lib/demoBackup.js";
import {createCombinedDemoBackup,inspectCombinedVolunteerNeeds,mergeMissingVolunteerNeeds} from "../src/lib/combinedDemoBackup.js";
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
