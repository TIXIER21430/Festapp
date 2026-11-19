import test from 'node:test';
import assert from 'node:assert/strict';
import {createTillFinanceRecord,createTillCorrectionRecord,isTillAccountingRecord,listTillSales,summarizeTillSales} from '../src/lib/tillSales.js';
import {validateDemoData} from '../src/lib/demoBackup.js';
const products=[{id:'vin-chaud',name:'Vin chaud',priceCents:300},{id:'crepe',name:'Crêpe',priceCents:250}];
const params={id:'vente-1',eventId:'noel-2026',at:'2026-11-19T11:15:00.000Z',cart:{'vin-chaud':2,crepe:1},products,method:'carte'};

test('a sale creates one event-scoped finance receipt without pretending to charge a card',()=>{
 const record=createTillFinanceRecord(params);
 assert.deepEqual(validateDemoData({finance:[record]}).finance,[record]);
 assert.equal(record.values[1],'8.50');
 assert.match(record.values[0],/Vin chaud × 2, Crêpe × 1/);
 assert.match(record.values[2],/Carte \(paiement externe\)/);
});
test('accounting summary stays scoped to one event and excludes non-till entries',()=>{
 const record=createTillFinanceRecord(params);
 assert.deepEqual(summarizeTillSales([record,{...record,id:'other',eventId:'fanfare'},{id:'note',eventId:'noel-2026',values:['Autre recette','100','Recette']}],'noel-2026'),{count:1,totalCents:850});
});
test('empty carts, unknown products and methods cannot create a sale',()=>{
 assert.throws(()=>createTillFinanceRecord({...params,cart:{}}),/article/);
 assert.throws(()=>createTillFinanceRecord({...params,cart:{other:1}}),/Unknown product/);
 assert.throws(()=>createTillFinanceRecord({...params,method:'sumup-api'}),/règlement/);
});
test('correction offsets a sale without destroying its original finance record',()=>{
 const original=createTillFinanceRecord(params);
 const correction=createTillCorrectionRecord({id:'correction-1',eventId:'noel-2026',saleId:original.id,finance:[original],at:'2026-11-19T11:30:00.000Z'});
 assert.deepEqual(validateDemoData({finance:[original,correction]}).finance,[original,correction]);
 assert.equal(correction.values[1],'-8.50');
 assert.equal(isTillAccountingRecord(correction),true);
 assert.equal(isTillAccountingRecord(original),true);
 assert.deepEqual(summarizeTillSales([original,correction],'noel-2026'),{count:0,totalCents:0});
 assert.equal(listTillSales([original,correction],'noel-2026')[0].cancelled,true);
 assert.throws(()=>createTillCorrectionRecord({id:'correction-2',eventId:'noel-2026',saleId:original.id,finance:[original,correction],at:'2026-11-19T11:31:00Z'}),/déjà annulée/);
});
test('a malformed, modified or unrelated cancellation cannot alter another event total',()=>{
 const original=createTillFinanceRecord(params);
 const bad={id:'faux',eventId:'noel-2026',values:['Annulation caisse · vente-1 · 19/11/2026','-0.01','Correction']};
 assert.equal(listTillSales([original,bad],'noel-2026')[0].cancelled,false);
 assert.deepEqual(summarizeTillSales([original,bad],'noel-2026'),{count:1,totalCents:850});
 assert.throws(()=>createTillCorrectionRecord({id:'c',eventId:'fanfare',saleId:original.id,finance:[original],at:'2026-11-19T11:31:00Z'}),/introuvable/);
});
