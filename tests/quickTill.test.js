import test from "node:test";
import assert from "node:assert/strict";
import {calculateTill,changeQuantity} from "../src/lib/quickTill.js";
test("adds amounts in integer cents",()=>{
 const cart=changeQuantity(changeQuantity({},"biere",2),"crepe",1);
 assert.equal(calculateTill(cart),900);
 assert.deepEqual(cart,{biere:2,crepe:1});
});
test("keeps each cart independent",()=>{
 const original={biere:1};
 const changed=changeQuantity(original,"biere",1);
 assert.equal(original.biere,1);
 assert.equal(changed.biere,2);
});
test("rejects unknown products and invalid quantities",()=>{
 assert.throws(()=>calculateTill({unknown:1}),TypeError);
 assert.throws(()=>calculateTill({biere:-1}),RangeError);
 assert.equal(changeQuantity({biere:1},"biere",-2).biere,0);
});
