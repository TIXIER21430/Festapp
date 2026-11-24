import test from 'node:test';
import assert from 'node:assert/strict';
import {stockGroup,compareStockNames,stockUnit,kegName,addKegStock} from '../src/lib/stockCatalog.js';
import {purchaseCatalog,setPurchaseQuantity,setPurchaseChecked,transferPurchases,purchaseFingerprint} from '../src/lib/purchaseStock.js';
import {suggestedSupplier} from '../src/lib/shoppingSuppliers.js';
import {stockIllustrationKind} from '../src/lib/stockIllustration.js';
test('catalog groups beverages, food and supplies, including liqueurs and fry trays',()=>{
 const names=['Bouteilles de gaz','Barquettes de frites','Oignons','Crème de cassis','Coca','Fût de bière 30 L – IPA','Vin rouge cubi 5 L'];
 assert.deepEqual(names.sort(compareStockNames),['Coca','Fût de bière 30 L – IPA','Vin rouge cubi 5 L','Crème de cassis','Oignons','Barquettes de frites','Bouteilles de gaz']);
 assert.equal(stockGroup('Crème liquide'),'Alimentation');
 assert.equal(stockUnit('Vin blanc cubi 3 L'),'cubis');
 assert.equal(suggestedSupplier('Crème de cassis'),'Leclerc');
 assert.equal(suggestedSupplier('Jambon entier à braiser'),'DS Restauration');
 assert.equal(stockIllustrationKind('Chocolat en poudre'),'powder');
 assert.equal(stockIllustrationKind('Barquettes de frites'),'cutlery');
});
test('kegs have separate stock identities by brand and volume and transfer independently',()=>{
 let n=0;const newId=()=>String(++n);
 let d={stock:[],shopping:[]};
 for(const [brand,capacity] of [['Blonde','20'],['Blonde','30'],['IPA','30']])d=addKegStock(d,{brand,capacity,newId});
 assert.throws(()=>addKegStock(d,{brand:' blonde ',capacity:'20',newId}),/existent/);
 assert.throws(()=>kegName('IPA','50'),/20 ou 30/);
 const names=d.stock.map(r=>r.values[0]);
 for(const name of names)d=setPurchaseQuantity(d,{name,value:'2',newId});
 for(const row of d.shopping)d=setPurchaseChecked(d,{rowId:row.id,checked:true});
 const next=transferPurchases(d,{actual:Object.fromEntries(d.shopping.map(r=>[r.id,'2'])),opening:Object.fromEntries(names.map(name=>[name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),'0'])),fingerprint:purchaseFingerprint(d),newId,date:'2026-11-24'});
 assert.equal(next.stock.length,3);assert.ok(next.stock.every(r=>r.values[1]==='2'));
 assert.equal(purchaseCatalog(next).length,3);
});
