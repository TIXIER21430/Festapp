import test from "node:test";
import assert from "node:assert/strict";
import {parseVolunteerNeeds,staffingStatus} from "../src/lib/volunteerNeeds.js";
test("staffing targets remain event-scoped and invalid values ignored",()=>{
 assert.deepEqual(parseVolunteerNeeds(JSON.stringify({e1:{"🍹 Bar":3,"🍳 Cuisine":-1},e2:{"🍹 Bar":2}})),{e1:{"🍹 Bar":3},e2:{"🍹 Bar":2}});
 assert.deepEqual(parseVolunteerNeeds("bad json"),{});
});
test("shortages are shown only for configured targets",()=>{
 assert.equal(staffingStatus(1,3).missing,2);
 assert.equal(staffingStatus(3,3).kind,"complete");
 assert.equal(staffingStatus(4,3).kind,"complete");
 assert.equal(staffingStatus(0,undefined).kind,"unset");
});
