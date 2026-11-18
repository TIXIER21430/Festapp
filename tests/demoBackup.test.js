import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup,parseDemoBackup,previewDemoBackup} from "../src/lib/demoBackup.js";
const sample={events:[{id:"seed-0",values:["Marché de Noël","2026-12-01","Liernais"]}],contacts:[{id:"a",values:["Élodie","Bénévole","élodie@example.org"]}]};
test("backup roundtrip preserves accents and IDs",()=>assert.deepEqual(parseDemoBackup(createDemoBackup(sample)),sample));
test("preview counts records without applying changes",()=>assert.deepEqual(previewDemoBackup(createDemoBackup(sample)).records,2));
test("unknown format rejected",()=>assert.throws(()=>parseDemoBackup('{"format":"other","version":1,"exportedAt":"2026-01-01","data":{}}')));
test("duplicate IDs rejected",()=>assert.throws(()=>createDemoBackup({events:[sample.events[0],sample.events[0]]})));
test("invalid record shapes rejected",()=>assert.throws(()=>createDemoBackup({events:[{id:"x",values:["a"]}]})));
test("unknown categories rejected",()=>assert.throws(()=>createDemoBackup({admin:[{id:"x",values:["a","b","c"]}]})));
test("invalid JSON rejected",()=>assert.throws(()=>parseDemoBackup("{")));
test("backup does not mutate source",()=>{const before=JSON.stringify(sample);createDemoBackup(sample);assert.equal(JSON.stringify(sample),before)});

test("task checklist phase survives backup and restore without becoming a due date",()=>{
 const data={tasks:[{id:"phase-1",eventId:"event-1",values:["Installer la buvette","",""],phase:"Veille",done:false}]};
 assert.deepEqual(parseDemoBackup(createDemoBackup(data)),data);
});
test("communication, material and archive records survive backup independently of photos",()=>{
 const data={posts:[{id:"p1",values:["Annonce","Texte Facebook","À relire"]}],equipment:[{id:"m1",values:["Tables","12","Dépôt"]}],archives:[{id:"a1",values:["Bilan","2026","À améliorer"]}]};
 assert.deepEqual(parseDemoBackup(createDemoBackup(data)),data);
 assert.throws(()=>createDemoBackup({photos:[{id:"img1",values:["Image","",""]}]}),/Invalid category/);
});
test("phase metadata cannot be smuggled into unrelated categories",()=>{
 assert.throws(()=>createDemoBackup({contacts:[{id:"c",values:["Nom","Bénévole","contact"],phase:"Veille"}]}));
});

test("UTF-8 backup limit rejects accented data exceeding 10 MB in bytes",()=>{
 const rows=Array.from({length:300},(_,i)=>({id:"accent-"+i,values:["é".repeat(20000),"",""]}));
 assert.throws(()=>createDemoBackup({contacts:rows}),RangeError);
});
test("UTF-8 restore rejects oversized accented backup without applying it",()=>{
 const rows=Array.from({length:300},(_,i)=>({id:"accent-"+i,values:["é".repeat(20000),"",""]}));
 const payload=JSON.stringify({format:"festapp-demo-backup",version:1,exportedAt:"2026-11-18T00:00:00.000Z",data:{contacts:rows}});
 assert.ok(payload.length<10_000_000);
 assert.ok(new TextEncoder().encode(payload).byteLength>10_000_000);
 assert.throws(()=>parseDemoBackup(payload),TypeError);
});
