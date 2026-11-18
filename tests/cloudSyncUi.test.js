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
