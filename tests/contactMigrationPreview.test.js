import test from "node:test";
import assert from "node:assert/strict";
import {previewContactMigration} from "../src/lib/contactMigrationPreview.js";
const row=(id,name,kind,contact)=>({id,values:[name,kind,contact]});
test("recognizes three committee contact categories and separates email/phone",()=>{
 const preview=previewContactMigration({contacts:[
  row("a","Élodie","Bénévole","elodie@example.org"),
  row("b","Exposant 1","exposants","06 12 34 56 78"),
  row("c","Fanfare","Groupe","")
 ]});
 assert.equal(preview.ready,true);
 assert.deepEqual(preview.accepted.map(x=>x.kind),["benevole","exposant","groupe"]);
 assert.equal(preview.accepted[0].email,"elodie@example.org");
 assert.equal(preview.accepted[1].phone,"06 12 34 56 78");
 assert.equal(preview.accepted[2].phone,null);
});
test("quarantines ambiguous category, free text and missing names",()=>{
 const result=previewContactMigration({contacts:[
  row("a","Alice","ami","alice@example.org"),
  row("b","Bob","Bénévole","Bob au 06 12 34 56 78"),
  row("c","","groupe","")
 ]});
 assert.equal(result.ready,false);
 assert.equal(result.accepted.length,0);
 assert.equal(result.review.length,3);
});
test("does not mutate original demo data or create remote records",()=>{
 const data={contacts:[row("a"," Alice ","Bénévole","alice@example.org")]};
 const original=JSON.stringify(data);
 const result=previewContactMigration(data);
 assert.equal(JSON.stringify(data),original);
 assert.equal(result.accepted[0].name,"Alice");
 assert.equal(result.accepted[0].sourceId,"a");
});
test("rejects malformed demo records rather than silently dropping them",()=>{
 assert.throws(()=>previewContactMigration({contacts:[{id:"a",values:["x"]}]}));
});

test("rejects duplicate source IDs before migration without mutating input",()=>{
 const data={contacts:[
  row("same","Alice","Bénévole","alice@example.org"),
  row("same","Bob","Exposant","bob@example.org")
 ]};
 const before=JSON.stringify(data);
 assert.throws(
  ()=>previewContactMigration(data),
  {name:"TypeError",message:"Invalid demo record"}
 );
 assert.equal(JSON.stringify(data),before);
});
