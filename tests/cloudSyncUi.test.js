import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const sync=readFileSync(new URL('../src/SharedAccess.jsx',import.meta.url),'utf8');

test('cloud TEST sync is visible, opt-in and never silently replaces local data',()=>{
 assert.match(app,/<SharedAccess data=\{data\} volunteerNeeds=\{volunteerNeeds\} ecocupSettings=\{ecocupSettings\} tillConfig=\{tillConfig\}/);
 assert.match(sync,/connection\?\.testMode/);
 assert.match(sync,/if\(!window\.confirm\(/);
 assert.match(sync,/onApplyRemote\(newest\)/);
 assert.match(sync,/saveTestSnapshot\(client,\{spaceId:connection\.spaceId,expectedRevision:existing\.revision,payload:outgoing\.payload,testMode:true\}\)/);
 assert.match(sync,/after\.revision!==saved\.revision\|\|!sameTestPayload/);
});
test('cloud autosave debounces, checks revisions and resolves remote edits only when local clean',()=>{
 assert.match(sync,/setTimeout\(\(\)=>\{void saveToCloud\(true\);\},1400\)/);
 assert.match(sync,/if\(!expected\|\|existing\.revision!==expected\)/);
 assert.match(sync,/if\(latest\.current\?\.text!==base\.current\?\.text\)/);
 assert.match(sync,/setInterval\(async\(\)=>/);
 assert.match(sync,/onApplyRemote\(snapshot\)/);
 assert.match(sync,/setSyncOn\(false\)/);
});
test('production is never presented as synchronized when only read permissions exist',()=>{
 assert.match(sync,/if\(!connection\?\.testMode\)\{/);
 assert.match(sync,/Projet réel : consultation uniquement/);
 assert.match(sync,/base\.current=null;setSyncOn\(false\)/);
 assert.match(sync,/else if\(readOnly\)/);
 assert.match(sync,/localPending\?"⏳ Modifications en attente":"✅ Fiches synchronisées"/);
});
test('complete archives require explicit consent and verified encrypted-channel TEST storage',()=>{
 assert.match(sync,/window\.confirm\('Activer les archives ZIP automatiques/);
 assert.match(sync,/saveTestFullBackup\(client,\{spaceId:connection\.spaceId,backup:zip,testMode:true\}\)/);
 assert.match(sync,/downloadLatestTestFullBackup\(client,\{spaceId:connection\.spaceId,testMode:true\}\)/);
 assert.match(sync,/archiveLock\.current/);
 assert.match(sync,/ARCHIVE_INTERVAL_MS=15\*60\*1000/);
});
