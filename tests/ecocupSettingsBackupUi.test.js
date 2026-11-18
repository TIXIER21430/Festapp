import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");

test("demo download includes current ecocup settings and preview reads them without applying them",()=>{
 assert.match(app,/createCombinedDemoBackup\(data,volunteerNeeds,undefined,ecocupSettings\)/);
 assert.match(app,/inspectCombinedEcocupSettings\(json\)/);
 assert.match(app,/Ils ne sont pas appliqués automatiquement/);
 assert.match(app,/Réglages écocups non présents dans ce fichier ancien/);
});

test("ecocup additions require a valid ledger under unchanged current settings before restore",()=>{
 assert.match(app,/hasEcocupAdditions/);
 assert.match(app,/summarizeEcocups\(\[\.\.\.\(data\.ecocups\|\|\[\]\),\.\.\.plan\.additions\.ecocups\]/);
 assert.match(app,/settingsSnapshot:JSON\.stringify\(ecocupSettings\)/);
 assert.match(app,/JSON\.stringify\(ecocupSettings\)!==restoreCandidate\.settingsSnapshot/);
 assert.match(app,/summarizeEcocups\(restored\.ecocups\|\|\[\]/);
});
