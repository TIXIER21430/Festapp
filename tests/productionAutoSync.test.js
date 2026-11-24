import test from 'node:test';
import assert from 'node:assert/strict';
import {decideProductionSync,readProductionBaseline,rememberProductionBaseline,recoverUnknownBaseline} from '../src/lib/productionAutoSync.js';
const decide=(localText,remoteText,remoteRevision,baseline,extra={})=>decideProductionSync({localText,remoteText,remoteRevision,baseline,...extra});
const base={revision:'2',text:'confirmed'};
test('identical copies automatically resume',()=>assert.equal(decide('same','same','3',null),'same'));
test('fresh untouched device receives populated cloud; unknown local changes never overwritten',()=>{
 assert.equal(decide('seed','cloud','3',null,{pristine:true,remoteHasRecords:true}),'receive');
 assert.equal(decide('seed','empty','1',null,{pristine:true,remoteHasRecords:false}),'conflict');
 assert.equal(decide('edited','cloud','3',null),'conflict');
});
test('reopening a previously synchronized device receives newer cloud only when local unchanged',()=>{
 assert.equal(decide('confirmed','new','3',base),'receive');
 assert.equal(decide('local edit','new','3',base),'conflict');
});
test('offline edits resume sending only against unchanged confirmed revision',()=>{
 assert.equal(decide('local edit','confirmed','2',base),'send');
 assert.equal(decide('local edit','confirmed','3',base),'conflict');
 assert.equal(decide('local edit','different','2',base),'conflict');
});
test('baseline storage is recoverable and failure is conservative',()=>{
 const map=new Map();const storage={getItem:k=>map.get(k),setItem:(k,v)=>map.set(k,v)};
 assert.equal(readProductionBaseline(storage,'key'),null);
 assert.equal(rememberProductionBaseline(storage,'key',base),true);
 assert.deepEqual(readProductionBaseline(storage,'key'),base);
 map.set('key','broken');assert.equal(readProductionBaseline(storage,'key'),null);
 assert.equal(rememberProductionBaseline({setItem(){throw Error('quota')}},'key',base),false);
});

test('a previously opened device with the exact default seed can receive without a browser baseline',()=>assert.equal(decide('seed','cloud','6',null,{pristine:true,remoteHasRecords:true}),'receive'));
test('missing baseline recovers only exact historical copies, never known unsent changes',async()=>{
 const input={decision:'conflict',baseline:null,localPayload:{data:{contacts:[]}},verifyPrevious:async()=>true};
 assert.equal(await recoverUnknownBaseline(input),'receive');
 assert.equal(await recoverUnknownBaseline({...input,verifyPrevious:async()=>false}),'conflict');
 assert.equal(await recoverUnknownBaseline({...input,baseline:base,verifyPrevious:async()=>{throw Error('must not call');}}),'conflict');
 assert.equal(await recoverUnknownBaseline({...input,verifyPrevious:async()=>{throw Error('network');}}),'conflict');
});
