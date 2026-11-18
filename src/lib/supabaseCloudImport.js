import {readTestSyncPayload} from './testSyncPayload.js';
import {DEMO_STORAGE_KEY} from './demoStorage.js';
import {VOLUNTEER_NEEDS_KEY} from './volunteerNeeds.js';
import {ECOCUP_DEMO_SETTINGS_KEY} from './ecocupDemoSettings.js';
import {TILL_CONFIG_KEY} from './tillConfig.js';

// Restore all small offline stores as one recoverable operation. Original photo
// blobs, private review checkmarks and other local keys are left untouched.
export function persistCloudSnapshot(storage,snapshot){
 const clean=readTestSyncPayload(snapshot);
 const entries=[
  [DEMO_STORAGE_KEY,JSON.stringify(clean.data)],
  [VOLUNTEER_NEEDS_KEY,JSON.stringify(clean.volunteerNeeds)],
  [ECOCUP_DEMO_SETTINGS_KEY,JSON.stringify(clean.ecocupSettings)],
  [TILL_CONFIG_KEY,JSON.stringify(clean.tillConfig)]
 ];
 const previous=entries.map(([key])=>[key,storage.getItem(key)]);
 try{for(const [key,value] of entries)storage.setItem(key,value);}
 catch(error){
  let rollbackFailed=false;
  for(const [key,old] of previous){
   try{if(old===null)storage.removeItem(key);else storage.setItem(key,old);}
   catch{rollbackFailed=true;}
  }
  throw new Error(rollbackFailed?'Restauration interrompue : vérifie immédiatement ta sauvegarde locale.':'Espace de stockage insuffisant. Tes fiches locales ont été conservées.');
 }
 return clean;
}
