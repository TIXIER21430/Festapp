import test from "node:test";
import assert from "node:assert/strict";
import {makeSharedSnapshot,validateSharedSnapshot,planSharedWrite} from "../src/lib/sharedSyncContract.js";
const data={events:[{id:"e1",values:["Carnaval","2027-02-01","Liernais"]}]};
test("validated snapshot keeps event data and staffing needs",()=>{
 const snapshot=makeSharedSnapshot({spaceId:"comite-liernais",revision:"rev1",data,volunteerNeeds:{e1:{"🍹 Bar":3}}});
 assert.deepEqual(validateSharedSnapshot(snapshot,"comite-liernais"),snapshot);
 assert.throws(()=>validateSharedSnapshot(snapshot,"another-association"));
});
test("stale edits and wrong associations cannot be committed",()=>{
 assert.deepEqual(planSharedWrite({spaceId:"a",remoteSpaceId:"a",baseRevision:"r1",remoteRevision:"r2"}),{allowed:false,reason:"conflict"});
 assert.equal(planSharedWrite({spaceId:"a",remoteSpaceId:"b",baseRevision:"r1",remoteRevision:"r1"}).allowed,false);
 assert.equal(planSharedWrite({spaceId:"a",remoteSpaceId:"a",baseRevision:"r1",remoteRevision:"r1"}).allowed,true);
});
test("invalid records and volunteer needs are refused",()=>{
 assert.throws(()=>makeSharedSnapshot({spaceId:"a",revision:"r1",data:{events:[{id:"e",values:["only-one"]}]}}));
 const snapshot=makeSharedSnapshot({spaceId:"a",revision:"r1",data,volunteerNeeds:{}});
 snapshot.volunteerNeeds={e1:{Bar:-2}};
 assert.throws(()=>validateSharedSnapshot(snapshot,"a"));
});
