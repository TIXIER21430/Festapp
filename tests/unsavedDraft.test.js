import test from 'node:test';
import assert from 'node:assert/strict';
import {hasUnsavedDraft} from '../src/lib/unsavedDraft.js';

test('closed and pristine forms do not warn',()=>{
 assert.equal(hasUnsavedDraft({open:false,form:['Un brouillon','','']}),false);
 assert.equal(hasUnsavedDraft({open:true,form:['','','']}),false);
});
test('new entries, including generated posts and contact details, warn before navigation',()=>{
 assert.equal(hasUnsavedDraft({open:true,form:['Marché de Noël','Texte à publier','']}),true);
 assert.equal(hasUnsavedDraft({open:true,form:['','',''],phone:'06 01 02 03 04'}),true);
});
test('unchanged saved entry does not warn, changed field or association does',()=>{
 const records=[{id:'1',values:['Titre','Texte','Brouillon'],eventId:'marche',email:'a@b.fr',phone:'06'}];
 const baseline={open:true,editingId:'1',form:['Titre','Texte','Brouillon'],eventId:'marche',email:'a@b.fr',phone:'06',records};
 assert.equal(hasUnsavedDraft(baseline),false);
 assert.equal(hasUnsavedDraft({...baseline,form:['Titre','Autre texte','Brouillon']}),true);
 assert.equal(hasUnsavedDraft({...baseline,eventId:'fanfare'}),true);
});
