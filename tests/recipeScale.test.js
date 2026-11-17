import test from "node:test";
import assert from "node:assert/strict";
import {scaleRecipeIngredients} from "../src/lib/recipeScale.js";
test("scales ingredient quantities without modifying the original",()=>{
 const original=[{name:"Farine",quantity:250,unit:"g"},{name:"Œufs",quantity:2,unit:"pièces"}];
 const result=scaleRecipeIngredients(original,4,10);
 assert.deepEqual(result,[{name:"Farine",quantity:625,unit:"g"},{name:"Œufs",quantity:5,unit:"pièces"}]);
 assert.equal(original[0].quantity,250);
});
test("allows smaller batches and rounds quantities",()=>{
 assert.equal(scaleRecipeIngredients([{name:"Lait",quantity:1,unit:"L"}],3,1)[0].quantity,0.33);
});
test("rejects invalid input",()=>{
 assert.throws(()=>scaleRecipeIngredients([],0,10),RangeError);
 assert.throws(()=>scaleRecipeIngredients([],2,0),RangeError);
 assert.throws(()=>scaleRecipeIngredients([{name:"x",quantity:-1,unit:"g"}],2,10),TypeError);
});
