import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeDriveSeed} from '../src/lib/mergeDriveSeed.js';

test('appends missing Drive rows while keeping existing edits untouched',()=>{
 const current={events:[{id:'a',values:['Noël','date locale','lieu local']}],tasks:[{id:'manual',values:['A','B','C'],done:true}]};
 const incoming={events:[{id:'a',values:['Noël','date Drive','lieu Drive']},{id:'b',values:['Fanfare','','']}],tasks:[{id:'drive',values:['Préparer','',''],done:false}]};
 const result=mergeDriveSeed(current,incoming);
 assert.equal(result.added,2);
 assert.deepEqual(result.data.events[0],current.events[0]);
 assert.deepEqual(result.data.tasks[0],current.tasks[0]);
 assert.equal(mergeDriveSeed(result.data,incoming).added,0);
});

test('rejects malformed seed without altering current input',()=>{
 const current={events:[{id:'a',values:['Test','','']}]};
 assert.throws(()=>mergeDriveSeed(current,{contacts:[{id:'x',values:['incomplet']}]}));
 assert.equal(current.events.length,1);
});
