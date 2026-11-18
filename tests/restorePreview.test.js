import test from "node:test";
import assert from "node:assert/strict";
import {createDemoBackup} from "../src/lib/demoBackup.js";
import {previewRestoreImpact} from "../src/lib/restorePreview.js";
const row=(id,name)=>({id,values:[name,"",""]});
test("previews replacements, additions and removal without changing originals",()=>{
 const current={events:[row("1","Old"),row("2","Keep")],contacts:[row("a","Alice")]};
 const backup=createDemoBackup({events:[row("2","New"),row("3","Added")]});
 const before=JSON.stringify(current);
 const preview=previewRestoreImpact(backup,current);
 assert.deepEqual(preview.categories,[{category:"events",current:2,incoming:2,matchingIds:1,wouldRemove:1,wouldAdd:1}]);
 assert.deepEqual(preview.existingCategoriesNotInBackup,["contacts"]);
 assert.equal(preview.requiresConfirmation,true);
 assert.equal(JSON.stringify(current),before);
});
test("fresh import has no collisions",()=>{
 const result=previewRestoreImpact(createDemoBackup({events:[row("1","Test")]}),{});
 assert.equal(result.requiresConfirmation,false);
 assert.equal(result.categories[0].wouldAdd,1);
});
test("rejects malformed backups",()=>assert.throws(()=>previewRestoreImpact('{"data":[]}',{})));
