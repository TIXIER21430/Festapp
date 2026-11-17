// Pure, network-free preparation for a future authenticated shared backend.
// No data is transmitted or written by this module.
import {validateDemoData} from "./demoBackup.js";
import {parseVolunteerNeeds} from "./volunteerNeeds.js";

export const SHARED_SYNC_FORMAT="festapp-shared-snapshot";
export const SHARED_SYNC_VERSION=1;

function validRevision(value){return typeof value==="string"&&/^[a-zA-Z0-9_-]{1,100}$/.test(value);}
function validSpace(value){return typeof value==="string"&&/^[a-zA-Z0-9_-]{1,100}$/.test(value);}

export function makeSharedSnapshot({spaceId,revision,data,volunteerNeeds}){
 if(!validSpace(spaceId)||!validRevision(revision))throw new TypeError("Invalid shared space or revision");
 return {format:SHARED_SYNC_FORMAT,version:SHARED_SYNC_VERSION,spaceId,revision,data:validateDemoData(data),volunteerNeeds:parseVolunteerNeeds(JSON.stringify(volunteerNeeds||{}))};
}

export function validateSharedSnapshot(snapshot,expectedSpaceId){
 if(!snapshot||snapshot.format!==SHARED_SYNC_FORMAT||snapshot.version!==SHARED_SYNC_VERSION||
 !validSpace(snapshot.spaceId)||!validRevision(snapshot.revision)||snapshot.spaceId!==expectedSpaceId)throw new TypeError("Invalid or foreign shared snapshot");
 const checked=makeSharedSnapshot(snapshot);
 if(JSON.stringify(checked.volunteerNeeds)!==JSON.stringify(snapshot.volunteerNeeds))throw new TypeError("Invalid shared volunteer targets");
 return checked;
}

// A stale client must never overwrite someone else's changes.
export function planSharedWrite({baseRevision,remoteRevision,spaceId,remoteSpaceId}){
 if(!validSpace(spaceId)||spaceId!==remoteSpaceId)return {allowed:false,reason:"wrong-space"};
 if(!validRevision(baseRevision)||!validRevision(remoteRevision))return {allowed:false,reason:"invalid-revision"};
 if(baseRevision!==remoteRevision)return {allowed:false,reason:"conflict"};
 return {allowed:true,reason:"up-to-date"};
}
