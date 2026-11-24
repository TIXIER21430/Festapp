import test from 'node:test';
import assert from 'node:assert/strict';
import {purchaseCatalog,setPurchaseQuantity,setPurchaseChecked,preparePurchaseTransfer,purchaseFingerprint,transferPurchases,isTransferred} from '../src/lib/purchaseStock.js';
import {stockIllustrationKind} from '../src/lib/stockIllustration.js';
let serial=0;const newId=()=>String(++serial);
const row=(id,name,qty='',status='',eventId)=>({id,values:[name,qty,status],...(eventId?{eventId}:{})});
const base=()=>({stock:[row('s1','Coca','12','5'),row('s2','Eau petite')],shopping:[row('a','Coca','24','Acheté','event'),row('b','Eau petite','6','Acheté','event'),row('c','Perrier','5','À acheter','event'),row('d','Coca','3','Acheté','other')]});
const options=(d,extra={})=>({scope:'event',actual:{a:'20',b:'8'},opening:{'eau petite':'2'},fingerprint:purchaseFingerprint(d,'event'),newId,date:'2026-11-24',...extra});
test('eight requested drinks have distinct illustrations',()=>{
 const names=['Coca','Orangina','Perrier','Ice Tea','Oasis','Eau petite','Eau grande','Pétillante grande'];
 assert.equal(new Set(names.map(stockIllustrationKind)).size,8);
});
test('catalog uses global stock without adding empty shopping rows',()=>{
 const d={stock:[row('s1','Coca'),row('s2','Eau petite'),row('s3','Scoped','','','event')],shopping:[]};
 assert.equal(purchaseCatalog(d,'event').length,2);
 const next=setPurchaseQuantity(d,{scope:'event',name:'Coca',value:'24',newId});
 assert.equal(next.shopping.length,1);assert.equal(next.shopping[0].eventId,'event');assert.equal(d.shopping.length,0);
 assert.equal(purchaseCatalog(next,'event').length,2);
});
test('transfer adjusts actual quantities, preserves thresholds, history and other events',()=>{
 const d=base(),next=transferPurchases(d,options(d));
 assert.deepEqual(next.stock.map(r=>r.values),[['Coca','32','5'],['Eau petite','10','']]);
 assert.ok(isTransferred(next.shopping[0]));assert.equal(next.shopping[0].values[1],'20');
 assert.equal(next.shopping[2].values[2],'À acheter');assert.equal(next.shopping[3].values[2],'Acheté');
 assert.equal(d.stock[0].values[1],'12');
 assert.throws(()=>transferPurchases(next,options(d)),/a changé/);
 assert.throws(()=>preparePurchaseTransfer(next,'event'),/Coche/);
});
test('unknown stock must be confirmed, invalid actual quantities and duplicates block all writes',()=>{
 const d=base();
 assert.throws(()=>transferPurchases(d,options(d,{opening:{}})),/stock actuel/);
 assert.throws(()=>transferPurchases(d,options(d,{actual:{a:'0',b:'8'}})),/invalide/);
 d.stock.push(row('dup','coca','3'));
 assert.throws(()=>transferPurchases(d,options(d)),/Doublon/);
});
test('new product creates stock, multiple checked rows aggregate, quantities use same units',()=>{
 const d={stock:[],shopping:[row('a','Coca','1,5','Acheté'),row('b','coca','2','Acheté')]};
 const next=transferPurchases(d,{scope:'',actual:{a:'1,5',b:'2'},fingerprint:purchaseFingerprint(d),newId,date:'2026-11-24'});
 assert.equal(next.stock.length,1);assert.equal(next.stock[0].values[1],'3.5');
});
test('changing checked quantity requires checking again',()=>{
 const d=base(),next=setPurchaseQuantity(d,{scope:'event',rowId:'a',value:'30',newId});
 assert.equal(next.shopping[0].values[2],'À acheter');
 assert.equal(setPurchaseChecked(next,{scope:'event',rowId:'a',checked:true}).shopping[0].values[2],'Acheté');
});
