import {parseVolunteerNeeds} from "./volunteerNeeds.js";
export const NEEDS_BACKUP_FORMAT="festapp-volunteer-needs";
export function exportVolunteerNeeds(needs){
 const clean=parseVolunteerNeeds(JSON.stringify(needs));
 return JSON.stringify({format:NEEDS_BACKUP_FORMAT,version:1,exportedAt:new Date().toISOString(),needs:clean},null,2);
}
export function importVolunteerNeeds(raw){
 if(typeof raw!=="string"||raw.length>1_000_000)throw new Error("Fichier trop volumineux ou invalide.");
 let doc;
 try{doc=JSON.parse(raw);}catch{throw new Error("Ce fichier n’est pas un JSON valide.");}
 if(!doc||doc.format!==NEEDS_BACKUP_FORMAT||doc.version!==1||!doc.needs||typeof doc.needs!=="object"||Array.isArray(doc.needs))throw new Error("Ce fichier n’est pas une sauvegarde des besoins bénévoles FEST’APP.");
 const clean=parseVolunteerNeeds(JSON.stringify(doc.needs));
 if(JSON.stringify(clean)!==JSON.stringify(doc.needs))throw new Error("La sauvegarde contient des besoins invalides.");
 return clean;
}
