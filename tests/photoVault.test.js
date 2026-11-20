import test from "node:test";
import assert from "node:assert/strict";
import {MAX_PHOTO_BYTES,PHOTO_CATEGORIES,validatePhotoInput} from "../src/lib/photoVault.js";
const image=(overrides={})=>({name:"recette.jpg",type:"image/jpeg",size:2048,...overrides});
test("preserves original file details and chosen recipe link",()=>{
 assert.deepEqual(validatePhotoInput(image(),"recipes","recipe-1"),{fileName:"recette.jpg",type:"image/jpeg",size:2048,scope:"recipes",recordId:"recipe-1"});
});
test("allows phone image formats and rejects executable SVG",()=>{
 assert.equal(validatePhotoInput(image({name:"cuisine.heic",type:"image/heic"}),"archives").type,"image/heic");
 assert.equal(validatePhotoInput(image(),"events","event-1").scope,"events");
 assert.throws(()=>validatePhotoInput(image({type:"image/svg+xml"}),"posts"),/refusée/);
});
test("every app record type supports an optional local photo",()=>{
 const expected=["events","tasks","shopping","stock","ecocups","contacts","shifts","feedback","recipes","finance","equipment","posts","archives"];
 assert.deepEqual([...PHOTO_CATEGORIES],expected);
 for(const scope of expected){
  const accepted=validatePhotoInput(image(),scope,`${scope}-1`);
  assert.equal(accepted.scope,scope);
  assert.equal(accepted.recordId,`${scope}-1`);
 }
 assert.throws(()=>validatePhotoInput(image({name:"danger.svg",type:"image/svg+xml"}),"contacts"),/refusée/);
});
test("rejects zero-byte files, too-large images, and unknown scope",()=>{
 assert.throws(()=>validatePhotoInput(image({size:0}),"recipes"),/refusée/);
 assert.throws(()=>validatePhotoInput(image({size:MAX_PHOTO_BYTES+1}),"recipes"),/refusée/);
 assert.throws(()=>validatePhotoInput(image(),"users"),/inconnue/);
});
