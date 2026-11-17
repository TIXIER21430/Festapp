import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const app=readFileSync(new URL("../src/main.jsx",import.meta.url),"utf8");
const css=readFileSync(new URL("../src/style.css",import.meta.url),"utf8");
test("print action requires an event with assignments",()=>{
 assert.match(app,/disabled=\{!printEvent\|\|!printSchedule\?\.total\}/);
 assert.match(app,/onClick=\{\(\)=>window\.print\(\)\}/);
});
test("print sheet uses only selected event's volunteer schedule",()=>{
 assert.match(app,/const printSchedule=printEvent\?volunteerSchedule\(data\.shifts\|\|\[\],printEvent\.id\):null/);
 const sheet=app.slice(app.indexOf('<section className="print-sheet"'));
 assert.match(sheet,/printSchedule\?\.scheduled/);
 assert.match(sheet,/printSchedule\.unscheduled/);
 assert.doesNotMatch(sheet,/data\.contacts|volunteers\.map/);
});
test("A4 stylesheet hides other modules when printing",()=>{
 assert.match(css,/@media print/);
 assert.match(css,/main>:not\(\.print-sheet\)\{display:none!important\}/);
});
