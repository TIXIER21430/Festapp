import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {sortContactsByName} from '../src/lib/contactSort.js';

const source=file=>readFileSync(new URL('../src/'+file,import.meta.url),'utf8');
const app=source('main.jsx');
const cards=source('RecordCardGrid.jsx');
const css=source('style.css');

test('contact names are sorted alphabetically without changing the stored order',()=>{
 const rows=[
  {id:'z',values:['Zoé','bénévole','']},
  {id:'e',values:['Émilie','groupe','']},
  {id:'a',values:['alice','exposant','']},
  {id:'a2',values:['Alice','bénévole','']},
  {id:'b',values:['Béatrice','bénévole','']}
 ];
 assert.deepEqual(sortContactsByName(rows).map(row=>row.id),['a','a2','b','e','z']);
 assert.deepEqual(rows.map(row=>row.id),['z','e','a','a2','b']);
 assert.match(app,/tab==="contacts"\?sortContactsByName\(filteredRecords\):filteredRecords/);
});

test('event-scoped modules switch directly while keeping the same manifestation',()=>{
 assert.match(app,/className="festapp-event-switcher" aria-label="Changer de rubrique dans cette manifestation"/);
 assert.match(app,/onClick=\{\(\)=>openModule\(key,scopeEvent\.id\)\}/);
 assert.match(app,/if\(eventId\)setHubEventId\(eventId\)/);
 assert.match(css,/\.festapp-event-switcher\{position:sticky;top:61px/);
});

test('private preparation shortcuts open their destinations, including event scope',()=>{
 assert.match(app,/className="till-product" key=\{key\} onClick=\{\(\)=>openModule\(key,eventOptions\.find/);
 assert.doesNotMatch(app,/onClick=\{\(\)=>\{setTab\(key\);setFilter\(""\)/);
});

test('archives search opens the hidden Drive section and focuses its search',()=>{
 const openDrive=app.slice(app.indexOf('function openDriveLibrary()'),app.indexOf('function openRecipeCalculator('));
 assert.match(openDrive,/setSettingsOpen\(true\)/);
 assert.match(openDrive,/moduleWorkbenchRef\.current\.open=false/);
 assert.match(openDrive,/advancedRef\.current\.open=true/);
 assert.match(openDrive,/getElementById\('drive-library'\)\?\.scrollIntoView/);
 assert.match(openDrive,/querySelector\('#drive-library input\[type="search"\]'\)\?\.focus/);
 assert.match(app,/className="archive-drive-link" onClick=\{event=>\{event\.preventDefault\(\);openDriveLibrary\(\);\}\}/);
});

test('a recipe detail offers quantity calculations with that recipe already selected',()=>{
 assert.match(cards,/category==='recipes'&&<button type="button" className="festapp-recipe-calculate-action"/);
 assert.match(cards,/onCalculateRecipe\?\.\(selected\)/);
 assert.match(app,/onCalculateRecipe=\{openRecipeCalculator\}/);
 assert.match(app,/function openRecipeCalculator\(recipe\)\{\s*setSelectedRecipeId\(recipe\.id\)/);
 assert.match(app,/recipeCalculatorRef\.current\.open=true/);
 assert.match(app,/ref=\{recipeCalculatorRef\}><summary>🧮 Calculer les quantités/);
});
