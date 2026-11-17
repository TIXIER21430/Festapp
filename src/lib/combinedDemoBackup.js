import {createDemoBackup,parseDemoBackup} from "./demoBackup.js";
import {parseVolunteerNeeds} from "./volunteerNeeds.js";
export function createCombinedDemoBackup(data,needs,timestamp){
 const doc=JSON.parse(createDemoBackup(data,timestamp));
 doc.volunteerNeeds=parseVolunteerNeeds(JSON.stringify(needs));
 return JSON.stringify(doc,null,2);
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
