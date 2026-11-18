import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/style.css",import.meta.url),"utf8");

test("the home screen has six large direct module shortcuts above long sections",()=>{
 const shortcuts=app.indexOf('aria-label="Accès rapide aux modules"');
 assert.ok(shortcuts>app.indexOf('className="hero"'));
 assert.ok(shortcuts<app.indexOf('<SharedAccess/>'));
 for(const name of ['"events"','"tasks"','"contacts"','"ecocups"','"shifts"','"recipes"']){
  assert.ok(app.slice(shortcuts,app.indexOf('<SharedAccess/>')).includes(name),name);
 }
 assert.match(app,/onClick=\{\(\)=>openModule\(key\)\}/);
 assert.match(css,/\.quick-access-grid\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(css,/@media\(max-width:650px\)\{\.quick-access-grid\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
 assert.match(css,/\.quick-access-tile\{[^}]*min-height:122px/);
});

test("module switching resets pending contact edits and moves keyboard focus",()=>{
 const handler=app.slice(app.indexOf('function openModule('),app.indexOf('function remove('));
 assert.match(handler,/setEditingId\(null\)/);
 assert.match(handler,/setContactEmail\(""\);setContactPhone\(""\)/);
 assert.match(handler,/setForm\(\["","",""\]\)/);
 assert.match(handler,/modulePanelRef\.current\?\.focus\(\{preventScroll:true\}\)/);
 assert.match(handler,/modulePanelRef\.current\?\.scrollIntoView/);
 assert.doesNotMatch(handler,/setData\(/);
 assert.match(app,/ref=\{modulePanelRef\} tabIndex=\{-1\}/);
});

test("dashboard ecocup badge checks the local ledger and handles invalid settings safely",()=>{
 assert.match(app,/ecocupSummary=summarizeEcocups\(data\.ecocups\|\|\[\],/);
 assert.match(app,/catch\(e\)\{ecocupError=/);
 assert.match(app,/ecocupSummary\.alert\?"⚠ Seuil atteint/);
 assert.match(app,/"Stock à vérifier"/);
 assert.match(app,/Chiffres de démonstration de cet appareil uniquement/);
});

test("all ten modules remain one tap away in the colorful mobile dashboard",()=>{
 const begin=app.indexOf('aria-label="Accès rapide aux modules"');
 const end=app.indexOf('className="event-cockpit"');
 const dashboard=app.slice(begin,end);
 for(const name of ['events','tasks','contacts','ecocups','shifts','recipes','shopping','stock','feedback','finance']){
  assert.ok(dashboard.includes('"'+name+'"'),name);
 }
 assert.match(css,/\.quick-access-tile:nth-child\(6n\+4\)/);
 assert.match(css,/\.event-cockpit-grid\{display:grid;grid-template-columns:repeat\(4,/);
});

test("event cockpit opens the chosen manifestation without changing records",()=>{
 const begin=app.indexOf('aria-label="Tableau de bord de la manifestation"');
 const end=app.indexOf('<SharedAccess/>');
 const cockpit=app.slice(begin,end);
 assert.match(cockpit,/selectedOverview\.taskProgress\.remaining/);
 assert.match(cockpit,/selectedOverview\.counts\.shopping/);
 assert.match(cockpit,/selectedOverview\.counts\.shifts/);
 assert.match(cockpit,/openModule\(key,eventOptions\.find\(/);
 assert.match(cockpit,/Préparer \{overviewEvent\}/);
 assert.match(cockpit,/scrollIntoView\(\{behavior:"smooth",block:"start"\}\)/);
 assert.doesNotMatch(cockpit,/setData\(/);
});
