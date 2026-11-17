import test from "node:test";
import assert from "node:assert/strict";
import {selectContactsForExport} from "../src/lib/contactExport.js";
test("exports only chosen volunteer, exhibitor or group category",()=>{
 const source=[{values:["Élodie","bénévole","06 01 02 03 04"]},{values:["Marchand","exposant","contact@example.fr"]},{values:["Fanfare","groupe","06 02 03 04 05"]}];
 assert.deepEqual(selectContactsForExport(source,"exposant"),[["Marchand","exposant","contact@example.fr"]]);
 assert.deepEqual(selectContactsForExport(source,"groupe"),[["Fanfare","groupe","06 02 03 04 05"]]);
 assert.equal(selectContactsForExport(source,"bénévole","élodie").length,1);
 assert.equal(selectContactsForExport(source,"bénévole","Marchand").length,0);
});
test("export rows are copies and invalid records are ignored",()=>{
 const row={values:["Alice","bénévole","06 00 00 00 00"]};
 const result=selectContactsForExport([row,{values:["incomplete"]}]);
 result[0][0]="Modified";
 assert.equal(row.values[0],"Alice");
 assert.throws(()=>selectContactsForExport(null),TypeError);
});
