import test from 'node:test';
import assert from 'node:assert/strict';
import {collectCommitteeTodos,collectEventTodos,createTodo,displayTodoDate,isValidTodoDate,todoStage} from '../src/lib/eventTodo.js';

test('general committee tasks are separate from every manifestation',()=>{
 const tasks=[{id:'g',values:['AG','','2026-11-20'],done:false},{id:'e',eventId:'noel',phase:'Avant',values:['Affiches','',''],done:true}];
 const all=collectCommitteeTodos(tasks);
 assert.deepEqual(all,{rows:[tasks[0]],total:1,done:0,remaining:1});
 const event=collectEventTodos(tasks,'noel','Marché de Noël');
 assert.equal(event[0].done,1);assert.equal(event[0].total,1);
 assert.equal(event.reduce((sum,g)=>sum+g.total,0),1);
});

test('historical Drive stages fall into avant pendant après without modifying records',()=>{
 assert.equal(todoStage({phase:'Veille'},'Marché de Noël'),'Avant');
 assert.equal(todoStage({values:['Préparer la salle','','Jour J']},'Fanfare'),'Pendant');
 assert.equal(todoStage({phase:'Jour J (RDV 9h00)'},'Marché de Noël'),'Pendant');
 assert.equal(todoStage({phase:'Samedi (RDV 8h00)'},'Fanfare'),'Pendant');
 assert.equal(todoStage({phase:'Veille',values:['Mettre les barrières en place','À attribuer','Veille']},'Fanfare'),'Pendant');
 assert.equal(todoStage({phase:'Veille',values:['Fin 2H00 idéalement','À attribuer','Veille']},'Fanfare'),'Pendant');
 assert.equal(todoStage({phase:'Dimanche'},'Fanfare'),'Après');
 assert.equal(todoStage({phase:'Dimanche'},'Saint-Laurent'),'Pendant');
 assert.equal(todoStage({phase:'Lundi ou mardi'},'Saint-Laurent'),'Après');
 assert.equal(todoStage({phase:'Journée démontage chapiteau'},'Fanfare'),'Après');
});

test('new todo keeps an optional date, its phase and an unchecked state',()=>{
 const todo=createTodo({id:'a',title:'  Réserver les barrières  ',dueDate:'2026-12-06',eventId:'noel',stage:'Avant'});
 assert.deepEqual(todo,{id:'a',values:['Réserver les barrières','','2026-12-06'],done:false,eventId:'noel',phase:'Avant'});
 assert.equal(displayTodoDate(todo.values[2]),'06/12/2026');
 assert.deepEqual(createTodo({id:'g',title:'Préparer la réunion'}),{id:'g',values:['Préparer la réunion','',''],done:false});
 assert.equal(isValidTodoDate('2026-02-29'),false);
 assert.throws(()=>createTodo({id:'x',title:'',dueDate:'2026-01-01'}),/Indique/);
 assert.throws(()=>createTodo({id:'x',title:'OK',dueDate:'2026-13-01'}),/Date/);
});
