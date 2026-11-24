import test from 'node:test';
import assert from 'node:assert/strict';
import {rentalEquipment} from '../src/lib/rentalCatalog.js';
import {currentEquipment,loanRecord,availableForPeriod} from '../src/lib/equipmentLoans.js';
import {validateDemoData} from '../src/lib/demoBackup.js';
test('explicit inventory association survives rename and quantity edit',()=>{
 const links=[{id:'table',values:['table','t1','']}];
 const record={id:'t1',values:['Mobilier pliant','30 unités','Local']};
 const get=equipment=>rentalEquipment(equipment,links).find(r=>r.id==='catalog-table');
 const loan=loanRecord('p1','out',{version:1,kind:'loan',start:'2026-11-24',end:'2026-11-26',created:'2026-11-24',customer:{name:'Test',address:'',phone:'0100000000',email:''},rateMode:'flat',depositCents:0,notes:'',items:[{equipmentId:'t1',name:'Table (8 places)',quantity:10,priceCents:0}]});
 assert.equal(currentEquipment(get([record]),[loan],'2026-11-24').available,20);
 const updated={...record,values:['Nouveau nom','40','Local']};
 assert.equal(currentEquipment(get([updated]),[loan],'2026-11-24').available,30);
 assert.equal(availableForPeriod(get([updated]),[loan],'2026-11-25','2026-11-26','2026-11-24'),30);
 assert.deepEqual(validateDemoData({equipmentRentalLinks:links}).equipmentRentalLinks,links);
 assert.equal(currentEquipment(get([]),[loan],'2026-11-24').available,null);
});
test('automatically matched inventory always reads new quantity',()=>{
 const get=n=>rentalEquipment([{id:'b1',values:['Bancs',String(n),'']}]).find(r=>r.id==='catalog-banc');
 assert.equal(currentEquipment(get(20),[]).available,20);
 assert.equal(currentEquipment(get(25),[]).available,25);
});

test('eight-seat rental tables use wooden brewery tables even when other tables exist',()=>{
 const records=[{id:'a',values:['Tables plastique','12','']},{id:'b',values:['Tables brasserie bois','30','']}];
 const get=()=>rentalEquipment(records).find(r=>r.id==='catalog-table');
 assert.equal(get().inventoryId,'b');
 assert.equal(currentEquipment(get(),[]).available,30);
 records[1].values[1]='40';
 assert.equal(currentEquipment(get(),[]).available,40);
});
