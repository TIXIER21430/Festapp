import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const component=readFileSync(new URL('../src/EventTill.jsx',import.meta.url),'utf8');
const grid=readFileSync(new URL('../src/RecordCardGrid.jsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');

test('till history is folded until requested and permits a clear correction action',()=>{
 assert.match(component,/<details className="festapp-till-history">/);
 assert.match(component,/Historique des ventes/);
 assert.match(component,/onClick=\{\(\)=>onCancelSale\(sale.id\)\}/);
 assert.match(app,/createTillCorrectionRecord/);
 assert.match(app,/Une écriture négative sera ajoutée au bilan/);
});
test('finance card protects till-origin entries from manual edit/delete',()=>{
 assert.match(grid,/lockedTillEntry=category==='finance'&&isTillAccountingRecord\(selected\)/);
 assert.match(grid,/!lockedTillEntry&&<button type="button" disabled=\{readOnly\} onClick=\{\(\)=>\{onEdit/);
 assert.match(grid,/!lockedTillEntry&&<button type="button" className="delete"/);
});
