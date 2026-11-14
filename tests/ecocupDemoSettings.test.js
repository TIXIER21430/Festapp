import test from "node:test";
import assert from "node:assert/strict";
import {DEFAULT_ECOCUP_SETTINGS,parseDemoEcocupSettings,serializeDemoEcocupSettings} from "../src/lib/ecocupDemoSettings.js";

test("paramètres écocups conservés après relecture",()=>{
 const saved=serializeDemoEcocupSettings({openingBalance:"250",alertThreshold:"50"});
 assert.deepEqual(parseDemoEcocupSettings(saved),{openingBalance:"250",alertThreshold:"50"});
});
test("données absentes ou corrompues réinitialisées sans exception",()=>{
 for(const input of [null,"", "{","[]", '{"openingBalance":-1}',"x".repeat(300)]) {
  assert.deepEqual(parseDemoEcocupSettings(input),DEFAULT_ECOCUP_SETTINGS);
 }
});
test("valeurs non sûres et négatives refusées",()=>{
 for(const value of ["-1","01","1.2","9007199254740992","1e3"]) {
  assert.throws(()=>serializeDemoEcocupSettings({openingBalance:value,alertThreshold:"100"}),TypeError);
 }
});
test("aucun champ supplémentaire conservé",()=>{
 assert.equal(serializeDemoEcocupSettings({openingBalance:"2",alertThreshold:"1",secret:"do-not-export"}),'{"openingBalance":"2","alertThreshold":"1"}');
});
