import test from 'node:test';
import assert from 'node:assert/strict';
import {availableEquipment,createEquipmentLoan,readEquipmentLoan,recordEquipmentReturn} from '../src/lib/equipmentLoans.js';

const equipment=[{id:'t1',values:['Barnum','5','Dépôt']}];
const draft={equipmentId:'t1',borrower:'Association voisine',destination:'Salle des fêtes',quantity:3,outDate:'2026-11-20',dueDate:'2026-11-23'};

test('prêt : qui, quoi, quand, où et disponibilité, sans modifier la fiche de stock',()=>{
 const original=JSON.stringify(equipment);
 const loan=createEquipmentLoan(draft,equipment,[],'p1');
 assert.deepEqual([readEquipmentLoan(loan).borrower,readEquipmentLoan(loan).destination],['Association voisine','Salle des fêtes']);
 assert.deepEqual(availableEquipment(equipment[0],[loan]),{total:5,outside:3,available:2});
 assert.equal(JSON.stringify(equipment),original);
 assert.throws(()=>createEquipmentLoan({...draft,quantity:3},equipment,[loan],'p2'),/insuffisante/);
});

test('retour partiel puis intégral : journal non destructif',()=>{
 const first=createEquipmentLoan(draft,equipment,[],'p1');
 const partial=recordEquipmentReturn(first,{id:'r1',quantity:1,date:'2026-11-21'});
 assert.deepEqual([readEquipmentLoan(partial).returned,readEquipmentLoan(partial).remaining],[1,2]);
 const finished=recordEquipmentReturn(partial,{id:'r2',quantity:2,date:'2026-11-22'});
 assert.deepEqual(availableEquipment(equipment[0],[finished]),{total:5,outside:0,available:5});
 assert.equal(readEquipmentLoan(finished).returns.length,2);
 assert.equal(readEquipmentLoan(first).returns.length,0);
 assert.throws(()=>recordEquipmentReturn(partial,{id:'r3',quantity:3,date:'2026-11-22'}),/supérieur/);
 assert.throws(()=>recordEquipmentReturn(partial,{id:'r1',quantity:1,date:'2026-11-22'}),/déjà/);
});

test('les dates, nombres et historiques corrompus sont refusés',()=>{
 assert.throws(()=>createEquipmentLoan({...draft,quantity:1.5},equipment,[],'p1'));
 assert.throws(()=>createEquipmentLoan({...draft,dueDate:'2026-11-19'},equipment,[],'p1'));
 assert.throws(()=>createEquipmentLoan({...draft,outDate:'2026-02-30'},equipment,[],'p1'));
 assert.throws(()=>availableEquipment({id:'t1',values:['Barnum','inconnue','Dépôt']},[]));
 const first=createEquipmentLoan(draft,equipment,[],'p1');
 assert.throws(()=>recordEquipmentReturn(first,{id:'r1',quantity:1,date:'2026-11-19'}));
 assert.throws(()=>readEquipmentLoan({...first,values:['t1','Nom','{}']}));
});
