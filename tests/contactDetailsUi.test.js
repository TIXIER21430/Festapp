import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";

const app=readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");

test("mobile contact form offers separate fields and validates them before saving",()=>{
 assert.match(app,/tab==="contacts"&&<>/);
 assert.match(app,/type="email"/);
 assert.match(app,/type="tel"/);
 assert.match(app,/validateContactDetails\(contactEmail,contactPhone\)/);
 assert.match(app,/setContactEmail\(record\.email\|\|""\)/);
 assert.match(app,/setContactPhone\(record\.phone\|\|""\)/);
});

test("export and search include structured fields without discarding legacy free text",()=>{
 assert.match(app,/selectContactsWithDetailsForExport\(data\.contacts\|\|\[\]/);
 assert.match(app,/buildCsv\(CONTACT_EXPORT_COLUMNS,rows\)/);
 assert.match(app,/r\.email\|\|"",r\.phone\|\|""/);
 assert.match(app,/Les anciennes coordonnées du champ libre restent intactes/);
});
