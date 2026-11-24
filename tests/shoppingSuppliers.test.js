import test from 'node:test';
import assert from 'node:assert/strict';
import {suggestedSupplier,assignPurchaseSupplier,supplierFor,shoppingExportGroups,shoppingExportText,shoppingMailto} from '../src/lib/shoppingSuppliers.js';
import {setPurchaseQuantity,setPurchaseChecked,transferPurchases,purchaseFingerprint} from '../src/lib/purchaseStock.js';
import {createDemoBackup,parseDemoBackup,validateDemoData} from '../src/lib/demoBackup.js';
import {makeShoppingDocx} from '../src/lib/reportDocx.js';
const row=(id,name,qty,status,supplier)=>({id,values:[name,qty,status],...(supplier?{supplier}:{})});
test('supplier suggestions follow committee purchasing habits and can be overridden',()=>{
 for(const [name,supplier] of Object.entries({'Coca':'Leclerc','Vin en cubi':'Leclerc','Liqueurs':'Leclerc','Bières canettes':'Leclerc','Frites':'DS Restauration','Crème':'DS Restauration','Jambon entier à rôtir':'DS Restauration','Pains panini':'DS Restauration','Fûts de bière':'Cave du Ternin','Vin en bouteilles':'Cave du Ternin','Nappes':'Centrakor','Assiettes':'Centrakor','Bouteilles de gaz':'Autre'}))assert.equal(suggestedSupplier(name),supplier,name);
 assert.equal(supplierFor(row('a','Vin','1','À acheter','Adagri')),'Adagri');
});
test('supplier survives sync validation, backup, quantity edits and stock transfer',()=>{
 let d={stock:[row('s','Vin','2','')],shopping:[]};
 d=setPurchaseQuantity(d,{name:'Vin',value:'3',newId:()=> 'a',supplier:'Adagri'});
 d=assignPurchaseSupplier(d,{rowId:'a',supplier:'Autre : Producteur local'});
 d=setPurchaseQuantity(d,{rowId:'a',name:'Vin',value:'4',newId:()=> 'b'});
 d=parseDemoBackup(createDemoBackup(d));
 assert.equal(d.shopping[0].supplier,'Autre : Producteur local');
 d=setPurchaseChecked(d,{rowId:'a',checked:true});
 d=transferPurchases(d,{actual:{a:'3'},fingerprint:purchaseFingerprint(d),newId:()=> 'b',date:'2026-11-24'});
 assert.equal(d.stock[0].values[1],'5');assert.equal(d.shopping[0].supplier,'Autre : Producteur local');
 assert.throws(()=>assignPurchaseSupplier(d,{rowId:'a',supplier:'Leclerc'}),/changé/);
 assert.throws(()=>validateDemoData({stock:[{...d.stock[0],supplier:'Adagri'}]}),/supplier/);
});
test('export groups only remaining purchases by supplier, excluding empty and transferred lines',()=>{
 const rows=[row('a','Coca','24','À acheter'),row('b','Vin','2','À acheter','Adagri'),row('c','Frites','5','Acheté'),row('d','Pain','3','Transféré au stock · 2026-11-24'),row('e','Eau','0','À acheter'),row('f','Gaz','1','À acheter','Autre : Local')];
 const groups=shoppingExportGroups(rows);
 assert.deepEqual(groups.map(g=>g.supplier),['Leclerc','Adagri','Autre : Local']);
 assert.equal(shoppingExportGroups(rows,{supplierFilter:'Adagri'})[0].items[0].name,'Vin');
 assert.equal(shoppingExportGroups(rows,{supplierFilter:'Autre'})[0].supplier,'Autre : Local');
 const text=shoppingExportText(groups,'Marché de Noël');
 assert.match(text,/24 × Coca/);assert.doesNotMatch(text,/Frites|Pain/);
 const url=shoppingMailto({recipient:'test@example.com',subject:'Courses',body:text});
 assert.ok(url.startsWith('mailto:'));assert.match(decodeURIComponent(url),/Marché de Noël/);
 assert.throws(()=>shoppingMailto({recipient:'test@example.com?bcc=x',subject:'Courses',body:text}),/invalide/);
});
test('shopping Word document uses existing DOCX generator',async()=>{
 const blob=await makeShoppingDocx({text:'LECLERC\n24 × Coca'});
 assert.equal(blob.type,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
 assert.deepEqual([...new Uint8Array(await blob.arrayBuffer()).slice(0,4)],[80,75,3,4]);
});
