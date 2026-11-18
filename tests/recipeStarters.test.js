import test from "node:test";
import assert from "node:assert/strict";
import {addMissingRecipeDrafts} from "../src/lib/recipeStarters.js";

test("two editable draft recipe cards are added without guessed quantities",()=>{
 const {recipes,added}=addMissingRecipeDrafts([]);
 assert.equal(added,2);
 assert.deepEqual(recipes.map(row=>row.values[0]),["Andouillettes","Pâte à crêpes"]);
 assert.ok(recipes.every(row=>row.values[1]===""&&row.values[2].includes("BROUILLON")));
});

test("existing real recipes are preserved and repeated action never duplicates",()=>{
 const original={id:"real-recipe",values:["Pâte à crêpes","250 g farine","Recette officielle"]};
 const first=addMissingRecipeDrafts([original]);
 assert.equal(first.added,1);
 assert.equal(first.recipes[0],original);
 assert.deepEqual(addMissingRecipeDrafts(first.recipes),{recipes:first.recipes,added:0});
});

test("invalid list rejected",()=>{
 assert.throws(()=>addMissingRecipeDrafts(null),TypeError);
});
