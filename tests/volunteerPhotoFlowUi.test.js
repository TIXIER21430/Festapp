import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {volunteerChoices} from '../src/lib/volunteerDirectory.js';
import {recordsForManifestation} from '../src/lib/manifestationScope.js';
import {validatePhotoInput} from '../src/lib/photoVault.js';

const source=file=>readFileSync(new URL(`../src/${file}`,import.meta.url),'utf8');
const app=source('main.jsx'),picker=source('VolunteerPhotoPicker.jsx'),css=source('style.css');

test('only directory volunteers appear in the photo selection, never exposants or contact details',()=>{
 const directory=[
  {id:'v1',values:['Alice','bénévole','privé'],email:'alice@exemple.fr',phone:'0600000000'},
  {id:'x1',values:['Stand B','exposant','privé']},
  {id:'v2',values:['Béatrice','BÉNÉVOLE','note privée']}
 ];
 assert.deepEqual(volunteerChoices(directory),[{id:'v1',name:'Alice'},{id:'v2',name:'Béatrice'}]);
 assert.doesNotMatch(picker,/person\.(?:email|phone)/);
 assert.match(picker,/listPhotoOriginals\('contacts'\)/);
 assert.match(picker,/portraits\.get\(person\.id\)/);
 assert.match(picker,/URL\.revokeObjectURL\(url\)/);
});

test('photo grid counts assignments only from the selected event',()=>{
 const shifts=[
  {id:'1',eventId:'fete-1',values:['Alice','10:00-12:00','Accueil']},
  {id:'2',eventId:'fete-2',values:['Alice','18:00-20:00','Bar']},
  {id:'3',eventId:'fete-1',values:['Béatrice','10:00-12:00','Bar']}
 ];
 assert.deepEqual(recordsForManifestation(shifts,'shifts','fete-1').map(row=>row.id),['1','3']);
 assert.match(app,/assignments=\{recordsForManifestation\(data\.shifts\|\|\[\],"shifts",scopeEvent\.id\)\}/);
 assert.match(picker,/counts\.get\(normalize\(person\.name\)\)/);
});

test('tapping a portrait fills an unsaved event-specific assignment, without creating a shift',()=>{
 const handler=app.slice(app.indexOf('function chooseVolunteerForEvent('),app.indexOf('function openNewVolunteerForEvent('));
 assert.match(handler,/allowDiscardDraft\(\)/);
 assert.match(handler,/setForm\(\[person\.name,"",""\]\)/);
 assert.match(handler,/setRecordEventId\(moduleScopeEventId\)/);
 assert.match(handler,/setModuleFormOpen\(true\)/);
 assert.doesNotMatch(handler,/setData\(/);
 assert.match(picker,/onClick=\{\(\)=>onSelect\(person\)\}/);
 assert.match(picker,/disabled=\{readOnly\}/);
});

test('new volunteer photo is optional and persisted under the stable contact ID',()=>{
 assert.match(app,/validatePhotoInput\(file,"contacts"\)/);
 assert.match(app,/await savePhotoOriginal\(contactPhotoFile,"contacts",row\.id\)/);
 assert.match(app,/contactPhotoSavingRef\.current=true/);
 assert.match(app,/Photo non enregistrée/);
 assert.match(app,/setContactPhotoFile\(null\)/);
 assert.match(app,/onChange=\{chooseContactPhoto\}/);
 assert.match(app,/Retirer la photo choisie/);
 assert.equal(validatePhotoInput({name:'portrait.jpg',type:'image/jpeg',size:1024},'contacts','v1').recordId,'v1');
 assert.throws(()=>validatePhotoInput({name:'portrait.svg',type:'image/svg+xml',size:1024},'contacts','v1'),/refusée/);
});

test('creation from a festival returns to its own assignment form and preserves drafts',()=>{
 assert.match(app,/if\(openModule\("contacts"\)===false\)return/);
 assert.match(app,/setReturnToVolunteerEventId\(eventId\)/);
 assert.match(app,/setForm\(\["","bénévole",""\]\)/);
 assert.match(app,/setModuleScopeEventId\(eventId\);setRecordEventId\(eventId\)/);
 assert.match(app,/setForm\(\[row\.values\[0\],"",""\]\);setModuleFormOpen\(true\)/);
 assert.match(app,/if\(contactPhotoSavingRef\.current\)return false/);
 assert.match(app,/\|\|!!contactPhotoFile/);
});

test('portrait tiles and photo-plus affordance fit mobile and use framed line icons',()=>{
 assert.match(picker,/className="festapp-volunteer-avatar"/);
 assert.match(picker,/ModuleGlyph kind="contacts"/);
 assert.match(css,/\.festapp-volunteer-grid\{display:grid;grid-template-columns:repeat\(2/);
 assert.match(css,/\.festapp-volunteer-avatar img\{display:block;width:100%;height:100%;object-fit:cover/);
 assert.match(css,/\.festapp-contact-photo-plus/);
 assert.match(css,/@media\(max-width:390px\)/);
});
