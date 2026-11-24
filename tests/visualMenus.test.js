import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const app=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const cards=readFileSync(new URL('../src/RecordCardGrid.jsx',import.meta.url),'utf8');
const equipment=readFileSync(new URL('../src/EquipmentGrid.jsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/style.css',import.meta.url),'utf8');

test('ordinary menus use the shared tile grid; shopping has its dedicated stock catalog',()=>{
 assert.match(app,/tab!=="equipment"&&tab!=="shopping"&&<RecordCardGrid category=\{tab\}/);
 assert.match(app,/tab==="shopping"&&<ShoppingList/);
 const shopping=readFileSync(new URL("../src/ShoppingList.jsx",import.meta.url),"utf8");
 assert.match(shopping,/<StockIllustration name=\{p.name\}/);
 assert.match(shopping,/Confirmer l’entrée en stock/);
 assert.match(app,/tab==="equipment"&&equipmentView==="inventory"&&<EquipmentGrid records=\{records\}/);
 assert.match(app,/tab==="equipment"&&equipmentView==="loans"&&<EquipmentLoans/);
 assert.match(cards,/className="festapp-record-grid"/);
 assert.match(cards,/role="dialog" aria-modal="true"/);
 assert.match(cards,/ModuleGlyph kind=\{category\}/);
 assert.match(cards,/className="festapp-icon-frame"/);
 assert.match(equipment,/className="festapp-icon-frame"/);
 assert.match(styles,/\.festapp-record-grid\{display:grid;grid-template-columns:repeat\(2/);
 assert.match(styles,/\.festapp-equipment-grid\{display:grid;grid-template-columns:repeat\(2/);
});

test('real local photos populate tiles without external images',()=>{
 assert.match(cards,/listPhotoOriginals\(category\)/);
 assert.match(equipment,/listPhotoOriginals\('equipment'\)/);
 assert.match(cards,/URL\.revokeObjectURL\(url\)/);
 assert.match(equipment,/URL\.revokeObjectURL\(url\)/);
 assert.match(cards,/savePhotoOriginal\(file,category,selected\.id\)/);
 assert.match(equipment,/savePhotoOriginal\(file,'equipment',selected\.id\)/);
 assert.doesNotMatch(cards,/https?:\/\//);
});

test('search and addition stay visible but forms and secondary utilities are folded',()=>{
 assert.match(app,/setModuleFormOpen\(false\);setModuleSearchOpen\(false\)/);
 assert.match(app,/tab==="contacts"\?contactFormOpen:tab==="equipment"\?equipmentFormOpen:moduleFormOpen/);
 assert.match(app,/onClick=\{openModuleForm\}>＋ Ajouter/);
 assert.match(app,/onClick=\{openEquipmentForm\}>＋ Ajouter/);
 assert.match(app,/🧮 Calculer les quantités/);
 assert.match(app,/📸 Gérer les photos de cette rubrique/);
 assert.match(app,/🕒 Répartition et planning des bénévoles/);
});

test('tasks remain one-tap checkable and contact phone links stay available',()=>{
 assert.match(cards,/category==='tasks'&&<label className="festapp-record-check"/);
 assert.match(cards,/checked=\{record\.done===true\} disabled=\{readOnly\}/);
 assert.match(cards,/href=\{'tel:'\+selected\.phone\}/);
 assert.match(cards,/href=\{'mailto:'\+selected\.email\}/);
});
