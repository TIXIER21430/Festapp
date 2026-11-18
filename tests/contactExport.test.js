import test from "node:test";
import assert from "node:assert/strict";
import {CONTACT_EXPORT_COLUMNS,selectContactsForExport,selectContactsWithDetailsForExport} from "../src/lib/contactExport.js";
import {buildCsv} from "../src/lib/csv.js";
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
test("detailed CSV selects by email and phone while preserving legacy contact",()=>{
 const contact={values:["Élodie","bénévole","ancienne note"],email:"elodie@example.fr",phone:"06 01 02 03 04"};
 const result=selectContactsWithDetailsForExport([contact,{values:["Groupe","groupe","contact libre"]}],"bénévole","elodie@example.fr");
 assert.deepEqual(result,[["Élodie","bénévole","ancienne note","elodie@example.fr","06 01 02 03 04"]]);
 assert.equal(selectContactsWithDetailsForExport([contact],"tous","06 01").length,1);
 assert.equal(CONTACT_EXPORT_COLUMNS.length,5);
 result[0][3]="changed";
 assert.equal(contact.email,"elodie@example.fr");
 const csv=buildCsv(CONTACT_EXPORT_COLUMNS,selectContactsWithDetailsForExport([contact]));
 assert.ok(csv.includes("E-mail"));
 assert.ok(csv.includes("Téléphone"));
 assert.ok(csv.includes("elodie@example.fr"));
});
test("detailed CSV escapes spreadsheet formulas in the new typed fields",()=>{
 const csv=buildCsv(CONTACT_EXPORT_COLUMNS,selectContactsWithDetailsForExport([{values:["Test","groupe",""],email:"=HYPERLINK(1)",phone:"+123456"}]));
 assert.ok(csv.includes("'=HYPERLINK(1)"));
 assert.ok(csv.includes("'+123456"));
});
