import test from "node:test";
import assert from "node:assert/strict";
import {suggestEventPurchases} from "../src/lib/eventPurchases.js";
test("extracts purchase suggestions from real preparation tasks",()=>{
 const tasks=[{eventId:"a",values:["Commander pain","","Avant"]},{eventId:"a",values:["Commander / acheter Gaz 4 bouteilles mini","","Avant"]},{eventId:"a",values:["Commander ecocups","","Avant"]},{eventId:"b",values:["Acheter lots tournoi","","Avant"]}];
 const result=suggestEventPurchases("a",tasks,[]);
 assert.deepEqual(result.map(x=>x.values[0]),["Pain","Bouteilles de gaz","Écocups"]);
 assert.ok(result.every(x=>x.eventId==="a"&&x.values[2]==="À prévoir"));
 assert.equal(suggestEventPurchases("a",tasks,result).length,0);
});
test("does not change input data or purchase stock",()=>{
 const tasks=[{eventId:"a",values:["Commander pain","","Avant"]}];
 const result=suggestEventPurchases("a",tasks,[]);
 result[0].values[1]="15";
 assert.equal(tasks[0].values[0],"Commander pain");
});
test("rejects invalid input",()=>assert.throws(()=>suggestEventPurchases("a",null,[])));
