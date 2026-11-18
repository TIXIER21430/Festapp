// Read-only checks for the two legacy auxiliary localStorage keys.
// Never silently turn a damaged saved value into a writable default.
import {ECOCUP_DEMO_SETTINGS_KEY,DEFAULT_ECOCUP_SETTINGS,serializeDemoEcocupSettings} from "./ecocupDemoSettings.js";
import {VOLUNTEER_NEEDS_KEY,parseVolunteerNeeds} from "./volunteerNeeds.js";

const ecocupError="Réglages écocups locaux illisibles : valeur conservée sur cet appareil. Mode lecture seule pour éviter de l’écraser.";
const needsError="Besoins bénévoles locaux illisibles : valeur conservée sur cet appareil. Mode lecture seule pour éviter de l’écraser.";

export function readDemoEcocupSettings(storage){
 try{
  const raw=storage.getItem(ECOCUP_DEMO_SETTINGS_KEY);
  if(raw===null)return {settings:{...DEFAULT_ECOCUP_SETTINGS},warning:"",readOnly:false};
  const candidate=JSON.parse(raw);
  const serialized=serializeDemoEcocupSettings(candidate);
  if(Object.keys(candidate).length!==2)throw new TypeError("Unexpected settings fields");
  return {settings:JSON.parse(serialized),warning:"",readOnly:false};
 }catch{return {settings:{...DEFAULT_ECOCUP_SETTINGS},warning:ecocupError,readOnly:true};}
}

export function readDemoVolunteerNeeds(storage){
 try{
  const raw=storage.getItem(VOLUNTEER_NEEDS_KEY);
  if(raw===null)return {needs:{},warning:"",readOnly:false};
  const candidate=JSON.parse(raw);
  const needs=parseVolunteerNeeds(raw);
  if(!candidate||typeof candidate!=="object"||Array.isArray(candidate)||
     JSON.stringify(candidate)!==JSON.stringify(needs))throw new TypeError("Invalid needs");
  return {needs,warning:"",readOnly:false};
 }catch{return {needs:{},warning:needsError,readOnly:true};}
}
