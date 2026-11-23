import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');

test('changing or closing a manifestation removes the previous module context',()=>{
 const handler=app.slice(app.indexOf('function selectManifestation(id)'),app.indexOf('function goToHome()'));
 assert.match(handler,/if\(!allowDiscardDraft\(\)\)return false/);
 assert.match(handler,/setModuleScopeEventId\(''\)/);
 assert.match(handler,/setRecordEventId\(''\)/);
 assert.match(handler,/moduleWorkbenchRef\.current\.open=false/);
 assert.match(handler,/setHubEventId\(id\)/);
});

test('volunteer planning in a manifestation does not ask to choose it again',()=>{
 assert.match(app,/data-event-scoped=\{!!scopeEvent\}/);
 assert.match(css,/\.festapp-workbench\[data-event-scoped="true"\] \.volunteer-agenda > label\s*\{\s*display:\s*none;/);
 assert.match(app,/setRecordEventId\(eventId\)/);
});
