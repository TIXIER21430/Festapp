import test from "node:test";
import assert from "node:assert/strict";
import {exportVolunteerNeeds,importVolunteerNeeds} from "../src/lib/volunteerNeedsBackup.js";
test("export and restore targets for distinct events",()=>{
 const data={e1:{"🍹 Bar":4},e2:{"🍳 Cuisine":2}};
 assert.deepEqual(importVolunteerNeeds(exportVolunteerNeeds(data)),data);
});
test("invalid imports are rejected instead of silently losing targets",()=>{
 assert.throws(()=>importVolunteerNeeds("broken"));
 assert.throws(()=>importVolunteerNeeds(JSON.stringify({format:"wrong",version:1,needs:{}})));
 assert.throws(()=>importVolunteerNeeds(JSON.stringify({format:"festapp-volunteer-needs",version:1,needs:{e1:{Bar:-2}}})));
});
