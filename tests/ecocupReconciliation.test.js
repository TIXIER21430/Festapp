import test from "node:test";
import assert from "node:assert/strict";
import {reconcileEcocupCount} from "../src/lib/ecocupReconciliation.js";
const movement=(id,kind,qty)=>({id,values:[kind,String(qty),"Marché"]});
test("physical shortage proposes approval, not a stock mutation",()=>{
 const rows=[movement("1","sortie",3)];const before=JSON.stringify(rows);
 const r=reconcileEcocupCount(rows,{openingBalance:20,countedQuantity:15,reason:"Comptage"});
 assert.deepEqual(r.proposedAdjustment,{kind:"sortie",quantity:2,reason:"Comptage",status:"pending-approval"});
 assert.equal(JSON.stringify(rows),before);
});
test("physical surplus proposes an incoming adjustment",()=>{
 const r=reconcileEcocupCount([],{openingBalance:4,countedQuantity:7,reason:"Retour"});
 assert.equal(r.proposedAdjustment.kind,"entrée");assert.equal(r.proposedAdjustment.quantity,3);
});
test("matching count needs no adjustment",()=>{
 assert.equal(reconcileEcocupCount([],{openingBalance:3,countedQuantity:3,reason:"Contrôle"}).proposedAdjustment,null);
});
test("reject invalid counts and missing reasons",()=>{
 for(const countedQuantity of [-1,1.5,NaN,Number.MAX_SAFE_INTEGER+1])
 assert.throws(()=>reconcileEcocupCount([],{countedQuantity,reason:"Contrôle"}));
 assert.throws(()=>reconcileEcocupCount([],{countedQuantity:1,reason:"  "}));
});
test("maximal recorded balance yields a safe negative adjustment",()=>{
 const r=reconcileEcocupCount([],{openingBalance:Number.MAX_SAFE_INTEGER,countedQuantity:0,reason:"Contrôle"});
 assert.equal(r.proposedAdjustment.quantity,Number.MAX_SAFE_INTEGER);
});
