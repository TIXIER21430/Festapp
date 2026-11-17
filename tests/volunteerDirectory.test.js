import test from "node:test";
import assert from "node:assert/strict";
import {volunteerChoices} from "../src/lib/volunteerDirectory.js";
test("only explicit volunteers appear and private details are omitted",()=>{
 const rows=[{id:"1",values:["Alice","bénévole","0600000000"]},{id:"2",values:["Bob","exposant","bob@example.com"]},{id:"3",values:["alice","BÉNÉVOLE","private"]},{id:"4",values:["Claire","bénévole","secret"]}];
 assert.deepEqual(volunteerChoices(rows),[{id:"1",name:"Alice"},{id:"4",name:"Claire"}]);
});
test("malformed rows do not break picker",()=>{
 assert.deepEqual(volunteerChoices([null,{id:"x",values:["","bénévole",""]},{id:"y",values:["D","autre",""]}]),[]);
});
