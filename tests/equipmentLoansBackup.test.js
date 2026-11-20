import test from 'node:test';
import assert from 'node:assert/strict';
import {createEquipmentLoan,recordEquipmentReturn} from '../src/lib/equipmentLoans.js';
import {createDemoBackup,parseDemoBackup} from '../src/lib/demoBackup.js';
import {planDemoRestore} from '../src/lib/demoRestorePlan.js';

test('les prêts et leurs retours sont conservés dans la sauvegarde de démonstration',()=>{
 const equipment=[{id:'e',values:['Barnum','3','Dépôt']}];
 const loan=createEquipmentLoan({equipmentId:'e',borrower:'Comité voisin',destination:'Salle',quantity:2,outDate:'2026-11-20',dueDate:null},equipment,[],'l');
 const returned=recordEquipmentReturn(loan,{id:'r',quantity:1,date:'2026-11-21'});
 const data={equipment,equipmentLoans:[returned]};
 assert.deepEqual(parseDemoBackup(createDemoBackup(data)),data);
 assert.throws(()=>createDemoBackup({equipmentLoans:[{...loan,values:['e','Nom','{}']}]}));
});

test('la restauration refuse un prêt orphelin avant toute écriture',()=>{
 const equipment=[{id:'barnum',values:['Barnum','2','Dépôt']}];
 const loan=createEquipmentLoan({equipmentId:'barnum',borrower:'Association',destination:'Salle des fêtes',quantity:1,outDate:'2026-11-20',dueDate:null},equipment,[],'pret-1');
 const backup=createDemoBackup({equipmentLoans:[loan]});
 const preview=planDemoRestore({},backup);
 assert.equal(preview.safeToAppend,false);
 assert.deepEqual(preview.danglingLinks,[{category:'equipmentLoans',id:'pret-1',equipmentId:'barnum'}]);
 const withEquipment=planDemoRestore({equipment},backup);
 assert.equal(withEquipment.safeToAppend,true);
});
