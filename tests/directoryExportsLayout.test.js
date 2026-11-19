import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const main=readFileSync(new URL('../src/main.jsx',import.meta.url),'utf8');
const till=readFileSync(new URL('../src/EventTill.jsx',import.meta.url),'utf8');

test('contact directory starts with compact search and add, hides entry form until requested',()=>{
 assert.match(main,/contactFormOpen,setContactFormOpen/);
 assert.match(main,/contactSearchOpen,setContactSearchOpen/);
 assert.match(main,/aria-expanded=\{contactSearchOpen\}>🔍/);
 assert.match(main,/＋ Ajouter/);
 assert.match(main,/tab!=="contacts"\|\|contactFormOpen\)\&\&<form/);
 assert.match(main,/tab!=="contacts"\&\&<label className="search"/);
 assert.doesNotMatch(main,/Exporter uniquement ces contacts en CSV/);
});

test('all exports are accessible in Plus, not attached to the current module',()=>{
 assert.match(main,/settingsOpen\&\&<>[\s\S]*?<section className="festapp-export-center"/);
 assert.match(main,/Tout exporter \(ZIP\)/);
 assert.match(main,/onClick=\{\(\)=>exportCsv\(exportCategory,exportContactType\)\}/);
 assert.match(main,/\(data\[category\]\|\|\[\]\)\.map\(r=>r\.values\)/);
 assert.match(main,/selectContactsWithDetailsForExport\(data\.contacts\|\|\[\],contactKind,""\)/);
 assert.match(main,/Besoins bénévoles \(JSON\)/);
 assert.match(main,/Menus de caisse \(JSON\)/);
 assert.doesNotMatch(main,/className="festapp-export-actions"/);
 assert.doesNotMatch(till,/Exporter les menus/);
});
