import {createDemoBackup,parseDemoBackup} from "./demoBackup.js";
import {parseVolunteerNeeds} from "./volunteerNeeds.js";
import {serializeDemoEcocupSettings} from "./ecocupDemoSettings.js";

// Optional fourth argument preserves compatibility with existing version-1 files.
export function createCombinedDemoBackup(data,needs,timestamp,ecocupSettings){
 const doc=JSON.parse(createDemoBackup(data,timestamp));
 doc.volunteerNeeds=parseVolunteerNeeds(JSON.stringify(needs));
 if(ecocupSettings!==undefined)doc.ecocupSettings=JSON.parse(serializeDemoEcocupSettings(ecocupSettings));
 const json=JSON.stringify(doc,null,2);
 // The needs extension must not make an exported backup too large to import.
 if(new TextEncoder().encode(json).byteLength>10_000_000)throw new RangeError("Backup too large to restore");
 return json;
}
export function inspectCombinedEcocupSettings(json){
 parseDemoBackup(json);
 const doc=JSON.parse(json);
 if(!Object.prototype.hasOwnProperty.call(doc,"ecocupSettings"))return {present:false,settings:null};
 const settings=doc.ecocupSettings;
 if(!settings||typeof settings!=="object"||Array.isArray(settings)||Object.keys(settings).length!==2){
  throw new TypeError("Invalid ecocup settings extension");
 }
 return {present:true,settings:JSON.parse(serializeDemoEcocupSettings(settings))};
}
export function inspectCombinedVolunteerNeeds(json){
 parseDemoBackup(json);
 const doc=JSON.parse(json);
 if(!Object.prototype.hasOwnProperty.call(doc,"volunteerNeeds"))return {present:false,needs:{}};
 if(!doc.volunteerNeeds||typeof doc.volunteerNeeds!=="object"||Array.isArray(doc.volunteerNeeds))throw new TypeError("Invalid volunteer targets");
 const clean=parseVolunteerNeeds(JSON.stringify(doc.volunteerNeeds));
 if(JSON.stringify(clean)!==JSON.stringify(doc.volunteerNeeds))throw new TypeError("Invalid volunteer targets");
 return {present:true,needs:clean};
}
export function mergeMissingVolunteerNeeds(current,incoming){
 const merged=parseVolunteerNeeds(JSON.stringify(current));
 const safe=parseVolunteerNeeds(JSON.stringify(incoming));
 for(const [eventId,posts] of Object.entries(safe)){
  const target={...(merged[eventId]||{})};
  for(const [post,count] of Object.entries(posts))if(!Object.prototype.hasOwnProperty.call(target,post))target[post]=count;
  merged[eventId]=target;
 }
 return merged;
}
