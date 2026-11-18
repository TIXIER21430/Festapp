import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {readDemoEcocupSettings,readDemoVolunteerNeeds} from "../src/lib/demoAuxStorage.js";
import {ECOCUP_DEMO_SETTINGS_KEY,DEFAULT_ECOCUP_SETTINGS} from "../src/lib/ecocupDemoSettings.js";
import {VOLUNTEER_NEEDS_KEY} from "../src/lib/volunteerNeeds.js";

function fakeStorage(entries={}){
 const values=new Map(Object.entries(entries));
 return {values,getItem(key){return values.has(key)?values.get(key):null;},setItem(key,value){values.set(key,value);}};
}

test("missing auxiliary keys remain writable without inserting data",()=>{
 const storage=fakeStorage();
 assert.deepEqual(readDemoEcocupSettings(storage),{settings:DEFAULT_ECOCUP_SETTINGS,warning:"",readOnly:false});
 assert.deepEqual(readDemoVolunteerNeeds(storage),{needs:{},warning:"",readOnly:false});
 assert.equal(storage.values.size,0);
});

test("valid ecocup and staffing settings survive loading without writes",()=>{
 const needs={"event-1":{"🍹 Bar":3}};
 const settings={openingBalance:"250",alertThreshold:"50"};
 const storage=fakeStorage({[ECOCUP_DEMO_SETTINGS_KEY]:JSON.stringify(settings),[VOLUNTEER_NEEDS_KEY]:JSON.stringify(needs)});
 assert.deepEqual(readDemoEcocupSettings(storage),{settings,warning:"",readOnly:false});
 assert.deepEqual(readDemoVolunteerNeeds(storage),{needs,warning:"",readOnly:false});
 assert.equal(storage.values.get(ECOCUP_DEMO_SETTINGS_KEY),JSON.stringify(settings));
 assert.equal(storage.values.get(VOLUNTEER_NEEDS_KEY),JSON.stringify(needs));
});

test("invalid saved ecocup settings are protected without overwriting the raw key",()=>{
 for(const raw of ["{", "null", '{"openingBalance":"-1","alertThreshold":"100"}', '{"openingBalance":"4","alertThreshold":"2","extra":"keep"}']){
  const storage=fakeStorage({[ECOCUP_DEMO_SETTINGS_KEY]:raw});
  const result=readDemoEcocupSettings(storage);
  assert.equal(result.readOnly,true,raw);
  assert.match(result.warning,/lecture seule/);
  assert.equal(storage.getItem(ECOCUP_DEMO_SETTINGS_KEY),raw);
 }
});

test("partially invalid volunteer needs are not silently replaced with filtered data",()=>{
 for(const raw of ["{", "[]", '{"event-1":{"Bar":3,"Cuisine":-2}}', '{"event-1":null}']){
  const storage=fakeStorage({[VOLUNTEER_NEEDS_KEY]:raw});
  const result=readDemoVolunteerNeeds(storage);
  assert.equal(result.readOnly,true,raw);
  assert.match(result.warning,/lecture seule/);
  assert.equal(storage.getItem(VOLUNTEER_NEEDS_KEY),raw);
 }
});

test("unreadable browser storage fails closed without a write",()=>{
 const storage={getItem(){throw new Error("denied")},setItem(){throw new Error("write must not happen")}};
 assert.equal(readDemoVolunteerNeeds(storage).readOnly,true);
 assert.equal(readDemoEcocupSettings(storage).readOnly,true);
});

test("the demo entrypoint honors auxiliary recovery locks before persisting",()=>{
 const app=readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");
 assert.match(app,/initialStorage\.readOnly\|\|initialNeedsStorage\.readOnly\|\|initialEcocupStorage\.readOnly/);
 assert.match(app,/if\(demoReadOnly\)return;try\{localStorage\.setItem\(ECOCUP_DEMO_SETTINGS_KEY/);
 assert.match(app,/if\(demoReadOnly\)return;try\{localStorage\.setItem\(VOLUNTEER_NEEDS_KEY/);
 assert.match(app,/function exportBackup\(\)\{if\(demoReadOnly\)/);
});
