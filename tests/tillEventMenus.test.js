import test from "node:test";
import assert from "node:assert/strict";
import {TILL_PRODUCTS,productsForEvent,calculateTill} from "../src/lib/quickTill.js";
test("Christmas market includes mulled wine and no hot dog",()=>{
 const ids=productsForEvent("Marché de Noël").map(p=>p.id);
 assert.ok(ids.includes("vin-chaud"));
 assert.ok(!ids.includes("hot-dog"));
});
test("large and small water are separate products",()=>{
 const ids=TILL_PRODUCTS.map(p=>p.id);
 assert.ok(ids.includes("petite-eau")&&ids.includes("grande-eau"));
 assert.ok(ids.includes("andouillette-frite")&&ids.includes("panini"));
});
test("unknown event shows full catalog, never hides purchases",()=>{
 assert.equal(productsForEvent("Halloween").length,TILL_PRODUCTS.length);
 assert.equal(calculateTill({"vin-chaud":2}),600);
});
