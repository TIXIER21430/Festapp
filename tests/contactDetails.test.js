import test from "node:test";
import assert from "node:assert/strict";
import {validateContactDetails} from "../src/lib/contactDetails.js";

test("separate email and phone are trimmed without altering caller data",()=>{
 const email="  elodie@example.fr ",phone=" 06 01 02 03 04 ";
 assert.deepEqual(validateContactDetails(email,phone),{email:"elodie@example.fr",phone:"06 01 02 03 04"});
 assert.deepEqual(validateContactDetails("",""),{email:"",phone:""});
});

test("invalid and oversized structured coordinates are rejected before save",()=>{
 for(const email of ["not-an-email","evil@example.fr\nBCC:someone@example.fr","x".repeat(321)]){
  assert.throws(()=>validateContactDetails(email,""),TypeError);
 }
 for(const phone of ["foo","12345","+".repeat(10),"0".repeat(65)]){
  assert.throws(()=>validateContactDetails("",phone),TypeError);
 }
 assert.throws(()=>validateContactDetails(null,"06 00 00 00 00"),TypeError);
});
