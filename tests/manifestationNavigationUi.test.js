import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=name=>readFileSync(new URL('../src/'+name,import.meta.url),'utf8');
const hub=source('ManifestationHub.jsx');
const todo=source('EventTodoList.jsx');
const bottom=source('BottomNavigation.jsx');
const app=source('main.jsx');
const css=source('style.css');

test('each manifestation has a dedicated to-do entry with avant pendant après',()=>{
 assert.match(hub,/onClick=\{\(\)=>doFeature\(key\)\}/);
 assert.match(hub,/key==='tasks'/);
 assert.match(hub,/<EventTodoList key=\{chosen\.id\}/);
 assert.match(todo,/collectEventTodos\(tasks,eventId,eventName\)/);
 assert.match(todo,/checked=\{task\.done===true\}/);
 assert.match(todo,/type="date"/);
 assert.match(todo,/➕ Ajouter une tâche/);
 assert.match(app,/createTodo\(\{\.\.\.values,id:crypto\.randomUUID\(\)\}\)/);
});

test('fixed bottom to-do is general to the committee and other destinations stay accessible',()=>{
 assert.match(bottom,/collectCommitteeTodos|<EventTodoList tasks=\{tasks\}/);
 assert.match(bottom,/À faire pour l’organisation générale/);
 for(const name of ['Manifestations','Bénévoles','Matériel','Finances'])assert.ok(bottom.includes(name),name);
 assert.match(css,/\.festapp-bottom-nav\{position:fixed/);
 assert.match(app,/ref=\{moduleWorkbenchRef\}/);
 assert.match(app,/moduleWorkbenchRef\.current\.open=true/);
});
