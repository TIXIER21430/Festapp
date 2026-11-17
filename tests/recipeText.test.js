import test from "node:test";
import assert from "node:assert/strict";
import {scaleRecipeText} from "../src/lib/recipeText.js";
test("scales French ingredient lines",()=>{
 assert.equal(scaleRecipeText("250 g farine\n2 œufs\n1,5 L lait",4,8),"500 g farine\n4 œufs\n3 L lait");
});
test("rejects unsupported quantities instead of silently changing recipes",()=>{
 assert.throws(()=>scaleRecipeText("une pincée de sel",4,8),/Unrecognized/);
 assert.throws(()=>scaleRecipeText("250 g farine",0,8),RangeError);
});
