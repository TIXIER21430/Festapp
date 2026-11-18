import test from "node:test";
import assert from "node:assert/strict";
import {createEventPostDraft} from "../src/lib/postDrafts.js";
test("draft names event and known date/place, but never invents a schedule",()=>{
 const d=createEventPostDraft({name:"Marché de Noël",date:"14/12",place:"Salle des fêtes"});
 assert.match(d.title,/Marché de Noël/);assert.match(d.body,/14\/12/);assert.match(d.body,/Salle des fêtes/);
 assert.doesNotMatch(d.body,/9h|10h|18h/);
 assert.match(d.body,/à vérifier/);
});
test("thank-you draft does not claim fictitious headcount or revenue",()=>{
 const d=createEventPostDraft({name:"Fanfare",kind:"remerciement",tone:"dynamique"});
 assert.match(d.body,/MERCI/);assert.doesNotMatch(d.body,/\d+ participants|euros/);
});
test("unknown event or template is rejected",()=>{
 assert.throws(()=>createEventPostDraft({name:"  "}),/manifestation/);
 assert.throws(()=>createEventPostDraft({name:"Fête",kind:"sponsorisé"}),/invalide/);
});
