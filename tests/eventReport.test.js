import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildEventReport,createReportNote,createPendingReportExpense,REPORT_NOTE_TYPES} from '../src/lib/eventReport.js';
import {makeEventReportDocx,reportDocxFileName} from '../src/lib/reportDocx.js';
import {createDemoBackup,parseDemoBackup} from '../src/lib/demoBackup.js';

const row=(id,eventId,values)=>({id,eventId,values});
const example={
 events:[{id:'fete-2026',values:['Saint-Laurent 2026','8 et 9 août 2026','Liernais']},{id:'fete-2025',values:['Saint-Laurent 2025','9 août 2025','Liernais']}],
 finance:[
  row('sale-a','fete-2026',['Vente caisse · 20/11/2026 10:00 · Bière × 2, Crêpe × 1','9.00','Recette · Espèces']),
  row('cancel-a','fete-2026',['Annulation caisse · sale-a · 20/11/2026 10:10','-9.00','Correction · Recette']),
  row('sale-b','fete-2026',['Vente caisse · 20/11/2026 11:00 · Bière × 3, Crêpe × 2','15.00','Recette · Espèces']),
  row('other-revenue','fete-2026',['Dons','10,00','Recette']),
  row('pending','fete-2026',['Sono','180,00','Dépense · Facture en attente (provisoire)']),
  row('paid','fete-2026',['Pain','25,50','Dépense']),
  row('unknown','fete-2026',['À classer','120','?']),
  row('isolation','fete-2025',['Autre année','9000','Recette'])
 ],
 feedback:[
  row('strength','fete-2026',['Bonne ambiance','Point fort','Bénévoles motivés']),
  row('weakness','fete-2026',['Manque de lumière','Point faible','Prévoir deux projecteurs']),
  row('next','fete-2026',['Réunion le 12 décembre','Date prochaine réunion','Salle du comité']),
  row('manual','fete-2026',['Andouillettes','Quantité utilisée','56 pièces']),
  row('legacy','fete-2026',['Ajuster les horaires','Observation','À revoir']),
  row('foreign','fete-2025',['Ne pas recopier','Point fort','Historique'])
 ],
 shopping:[row('shop','fete-2026',['Gobelets','200','À acheter']),row('old-shop','fete-2025',['Bouteilles','50','Acheté'])]
};

test('event reports isolate each edition and keep provisional expenses visible without double counting',()=>{
 const report=buildEventReport(example,'fete-2026');
 assert.equal(report.event.name,'Saint-Laurent 2026');
 assert.equal(report.finance.revenueCents,2500);
 assert.equal(report.finance.expenseCents,20550);
 assert.equal(report.finance.balanceCents,-18050);
 assert.equal(report.finance.pendingExpenseCents,18000);
 assert.equal(report.finance.pending.length,1);
 assert.equal(report.finance.unclassified.length,1);
 assert.equal(report.shopping.length,1);
 assert.equal(report.shopping[0].article,'Gobelets');
 assert.equal(report.sections['Point fort'].length,1);
 assert.equal(report.sections['Date prochaine réunion'][0].subject,'Réunion le 12 décembre');
 assert.equal(report.otherNotes[0].subject,'Ajuster les horaires');
 assert.ok(!JSON.stringify(report).includes('9000'));
});

test('sold quantities sum by product only for non-cancelled sales and do not invent physical consumption',()=>{
 const report=buildEventReport(example,'fete-2026');
 assert.deepEqual(report.quantities.items,[{name:'Bière',quantity:3},{name:'Crêpe',quantity:2}]);
 assert.equal(report.quantities.unreadable.length,0);
 assert.equal(report.sections['Quantité utilisée'][0].details,'56 pièces');
 assert.throws(()=>buildEventReport(example,'unknown'),/Sélectionne/);
});

test('report additions reuse validated, event-scoped backup records and never overwrite others',()=>{
 const note=createReportNote({id:'note-new',eventId:'fete-2026',type:'Matériel à acheter',subject:'Égouttoir',details:'2 exemplaires'});
 const expense=createPendingReportExpense({id:'exp-new',eventId:'fete-2026',label:'Vaisselle',amount:'105,20'});
 const augmented={...example,feedback:[...example.feedback,note],finance:[...example.finance,expense]};
 const restored=parseDemoBackup(createDemoBackup(augmented,'2026-11-20T17:00:00Z'));
 assert.deepEqual(restored.feedback.at(-1),note);
 assert.deepEqual(restored.finance.at(-1),expense);
 assert.equal(buildEventReport(restored,'fete-2026').finance.pendingExpenseCents,28520);
 assert.deepEqual(REPORT_NOTE_TYPES.includes('À ajouter au compte rendu'),true);
});

test('reject invalid notes, invalid money and unlinked festivals',()=>{
 assert.throws(()=>createReportNote({id:'a',eventId:'e',type:'mauvaise rubrique',subject:'Sujet'}),/Rubrique/);
 assert.throws(()=>createReportNote({id:'a',eventId:'e',type:'Point fort',subject:' '}),/Précise/);
 assert.throws(()=>createPendingReportExpense({id:'x',eventId:'e',label:'Test',amount:'-1'}),/positif/);
 assert.throws(()=>createPendingReportExpense({id:'x',eventId:'e',label:'Test',amount:'invalid'}),/positif/);
});

test('Word export is a genuine zipped DOCX with escaped, editable content and no annuaire coordinates',async()=>{
 const data={...example,feedback:[...example.feedback,row('special','fete-2026',['Détails <&>','À ajouter au compte rendu','À relire dans Word'])],contacts:[{id:'private',values:['Jules','bénévole','secret'],phone:'0611223344',email:'private@example.fr'}]};
 const report=buildEventReport(data,'fete-2026');
 const docx=await makeEventReportDocx(report);
 assert.equal(docx.type,'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
 const bytes=new Uint8Array(await docx.arrayBuffer());
 assert.deepEqual([...bytes.slice(0,4)],[80,75,3,4]);
 const xml=new TextDecoder().decode(bytes);
 assert.match(xml,/word\/document\.xml/);
 assert.match(xml,/Compte rendu de manifestation/);
 assert.match(xml,/Détails &lt;&amp;&gt;/);
 assert.match(xml,/Factures encore en attente/);
 assert.match(xml,/Quantités vendues en caisse/);
 assert.doesNotMatch(xml,/0611223344|private@example\.fr|Autre année/);
 assert.equal(reportDocxFileName(report),'FESTAPP-compte-rendu-Saint-Laurent-2026.docx');
});

test('festival entry and sharing UI exist without a silent paid mail service or remote writes',()=>{
 const hub=readFileSync(new URL('../src/ManifestationHub.jsx',import.meta.url),'utf8');
 const form=readFileSync(new URL('../src/EventReport.jsx',import.meta.url),'utf8');
 const app=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
 assert.match(hub,/\['report','📄','Compte rendu Word'\]/);
 assert.match(app,/onOpenReport=\{openReportForEvent\}/);
 assert.match(app,/writeDemoStorage\(localStorage,next\)/);
 assert.match(form,/mailto:/);
 assert.match(form,/navigator\.share/);
 assert.match(form,/en pièce jointe avant d’envoyer/);
 assert.doesNotMatch(form,/supabase|sendEmail|fetch\(/i);
});
