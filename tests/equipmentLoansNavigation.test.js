import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source = path => readFileSync(new URL(path,import.meta.url),'utf8');

test('le matériel apparaît dans le menu bas et ouvre les deux vues',()=>{
 const bottom=source('../src/BottomNavigation.jsx');
 const app=source('../src/main.jsx');
 assert.match(bottom,/\['equipment','🧰','Matériel',\(\)=>onOpenModule\('equipment'\)\]/);
 assert.match(app,/festapp-equipment-submenu/);
 assert.match(app,/Fiches avec photos/);
 assert.match(app,/Prêts \/ retours/);
 assert.match(app,/onIssue=\{issueEquipmentLoan\}/);
 assert.match(app,/onReturn=\{returnEquipmentLoan\}/);
});

test('les fiches affichent le disponible et protègent leur historique de prêts',()=>{
 const app=source('../src/main.jsx');
 const grid=source('../src/EquipmentGrid.jsx');
 const css=source('../src/style.css');
 assert.match(grid,/availableEquipment\(item,loans\)/);
 assert.match(grid,/Disponibles :/);
 assert.match(grid,/savePhotoOriginal\(/);
 assert.match(app,/Cette fiche est liée à un historique de prêt/);
 assert.match(css,/grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
});

test('le journal des prêts confirme uniquement après stockage local réussi',()=>{
 const app=source('../src/main.jsx');
 assert.match(app,/const result=writeDemoStorage\(localStorage,next\)/);
 assert.match(app,/if\(!result\.saved\)throw new Error\("Prêt non conservé/);
 const loans=source('../src/EquipmentLoans.jsx');
 assert.match(loans,/ils ne sont pas synchronisés/i);
});
