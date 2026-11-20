import test from 'node:test';
import assert from 'node:assert/strict';
import {createFestivalEdition,driveBalanceLinks,eventEditionYear,eventYearBalance,festivalName,groupFestivalEditions,updateEventDetails,yearChoices} from '../src/lib/eventEditions.js';

const events=[
 {id:'template',values:['Fanfare','','']},
 {id:'f22',values:['Fanfare 2022','24/07/2022','Liernais']},
 {id:'f24',values:['Fanfare','16/07/2024 · 20h','Liernais']},
 {id:'noel22',values:['Marché de Noël 2022','','']}
];
const finance=[
 {id:'rec',eventId:'f22',values:['Buvette','100,50','Recette']},
 {id:'dep',eventId:'f22',values:['Pain','40','Dépense']},
 {id:'cancel',eventId:'f22',values:['Annulation caisse · vente-1 · 2022','-10.50','Correction · Recette · Espèces']},
 {id:'unsure',eventId:'f22',values:['Document ancien','200','Bilan annuel']},
 {id:'later',eventId:'f24',values:['Buvette','500','Recette']},
 {id:'otherFestival',eventId:'noel22',values:['Marché','600','Recette']},
 {id:'unlinked',values:['Fanfare 2022', '9999','Recette']}
];

test('groups different years of the same festival without confusing its template',()=>{
 assert.equal(festivalName('Marché de Noël 2024'),'Marché de Noël');
 assert.equal(eventEditionYear(events[2]),2024);
 assert.equal(eventEditionYear(events[0]),null);
 assert.deepEqual(groupFestivalEditions(events).map(g=>[g.name,g.events.length]),[['Fanfare',3],['Marché de Noël',1]]);
 assert.ok(yearChoices(events,2026).includes(2021));
 assert.ok(yearChoices(events,2026).includes(2022));
 assert.ok(yearChoices(events,2026).includes(2024));
});

test('historical balance includes only exact edition IDs; errors stay visible but do not distort totals',()=>{
 const b22=eventYearBalance(events,finance,'Fanfare',2022);
 assert.deepEqual([b22.revenueCents,b22.expenseCents,b22.balanceCents,b22.unclassified,b22.rows.length],[9000,4000,5000,1,4]);
 const b24=eventYearBalance(events,finance,'Fanfare',2024);
 assert.deepEqual([b24.revenueCents,b24.expenseCents,b24.balanceCents,b24.rows.length],[50000,0,50000,1]);
 const b21=eventYearBalance(events,finance,'Fanfare',2021);
 assert.equal(b21.editions.length,0);
 assert.equal(b21.rows.length,0);
});

test('editing an event keeps its ID and avoids changing unrelated editions',()=>{
 const edited=updateEventDetails(events,'f22',['Fanfare 2022','23/07/2022','Place de la mairie']);
 assert.equal(edited[1].id,'f22');
 assert.equal(edited[1].values[1],'23/07/2022');
 assert.equal(events[1].values[1],'24/07/2022');
 assert.equal(edited[2],events[2]);
 assert.throws(()=>updateEventDetails(events,'f22',['Fanfare','','']),/déjà ce nom/);
 assert.throws(()=>updateEventDetails(events,'f22',['Fanfare 2022','23/07/2024','Liernais']),/ne correspond pas à la date/);
});

test('new historical edition starts blank and refuses duplicate years',()=>{
 assert.deepEqual(createFestivalEdition(events,'Fanfare',2021,'new-21'),{id:'new-21',values:['Fanfare 2021','','']});
 assert.throws(()=>createFestivalEdition(events,'Fanfare','2022','duplicate'),/déjà une édition/);
 assert.throws(()=>createFestivalEdition(events,'Fanfare','abc','not-valid'),/année valide/);
});

test('only matching year, festival and safe Drive links are suggested',()=>{
 const catalog={files:[
  {id:'ok',title:'Bilan Fanfare 2022',folder:'Manifestations/Fanfare',url:'https://drive.google.com/file/d/abc/view'},
  {id:'wrongYear',title:'Bilan Fanfare 2024',folder:'Manifestations/Fanfare',url:'https://drive.google.com/file/d/def/view'},
  {id:'wrongEvent',title:'Bilan Carnaval 2022',folder:'Manifestations',url:'https://drive.google.com/file/d/ghi/view'},
  {id:'unsafe',title:'Bilan Fanfare 2022',folder:'Manifestations',url:'https://example.com/bilan'}
 ]};
 assert.deepEqual(driveBalanceLinks(catalog,'Fanfare',2022).map(file=>file.id),['ok']);
});
