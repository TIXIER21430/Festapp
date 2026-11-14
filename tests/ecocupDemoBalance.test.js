import test from "node:test";
import assert from "node:assert/strict";
import {summarizeEcocups} from "../src/lib/ecocupDemoBalance.js";
const move=(id,kind,quantity,event="Fête")=>({id,values:[kind,quantity,event]});
test("entrées et sorties conservent l'historique",()=>{
 const result=summarizeEcocups([move("a","entrée","20"),move("b","sortie","7")],{openingBalance:5,alertThreshold:15});
 assert.equal(result.balance,18);assert.equal(result.alert,false);assert.deepEqual(result.history.map(x=>x.balance),[25,18]);
});
test("alerte au seuil inclus",()=>assert.equal(summarizeEcocups([move("a","sortie","2")],{openingBalance:12,alertThreshold:10}).alert,true));
test("stock négatif interdit",()=>assert.throws(()=>summarizeEcocups([move("a","sortie","2")],{openingBalance:1}),RangeError));
test("identifiants doublons interdits",()=>assert.throws(()=>summarizeEcocups([move("a","entrée","1"),move("a","entrée","1")])));
test("quantités invalides interdites",()=>{for(const q of ["0","-1","1.5","1e3","abc","9007199254740993"])assert.throws(()=>summarizeEcocups([move("a","entrée",q)]));});
test("paramètres invalides interdits",()=>assert.throws(()=>summarizeEcocups([],{openingBalance:-1})));
test("entrée ne modifie pas la source",()=>{const rows=[move("a","entrée","2")];const before=JSON.stringify(rows);summarizeEcocups(rows);assert.equal(JSON.stringify(rows),before);});

test("quantité minimale pour lever l'alerte, seuil inclus",()=>{
 assert.equal(summarizeEcocups([],{openingBalance:9,alertThreshold:10}).minimumToClearAlert,2);
 assert.equal(summarizeEcocups([],{openingBalance:10,alertThreshold:10}).minimumToClearAlert,1);
 assert.equal(summarizeEcocups([],{openingBalance:11,alertThreshold:10}).minimumToClearAlert,0);
});
test("seuil maximal ne produit pas de quantité non sûre",()=>{
 const result=summarizeEcocups([],{openingBalance:0,alertThreshold:Number.MAX_SAFE_INTEGER});
 assert.equal(result.alert,true);
 assert.equal(result.minimumToClearAlert,null);
});
test("calcul de réapprovisionnement ne modifie pas les mouvements",()=>{
 const rows=[move("a","sortie","3")];
 const original=JSON.stringify(rows);
 assert.equal(summarizeEcocups(rows,{openingBalance:10,alertThreshold:8}).minimumToClearAlert,2);
 assert.equal(JSON.stringify(rows),original);
});
