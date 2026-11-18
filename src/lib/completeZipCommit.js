import {DEMO_STORAGE_KEY} from './demoStorage.js';
import {VOLUNTEER_NEEDS_KEY} from './volunteerNeeds.js';
import {ECOCUP_DEMO_SETTINGS_KEY,serializeDemoEcocupSettings} from './ecocupDemoSettings.js';
import {TILL_CONFIG_KEY,validateTillConfig} from './tillConfig.js';
import {OWNER_REVIEW_KEY,parseOwnerReviews} from './ownerSetup.js';

// No existing record is deleted; the caller must have previewed and explicitly
// confirmed the plan. Roll back browser settings if any localStorage write fails.
// IndexedDB photos are handled separately in a single transaction by the caller.
export function persistCompleteZipRestore(storage,plan){
 if(!plan?.safe)throw new TypeError('La prévisualisation contient des conflits.');
 const updates=[
  [DEMO_STORAGE_KEY,JSON.stringify(plan.nextData)],
  [VOLUNTEER_NEEDS_KEY,JSON.stringify(plan.nextNeeds)],
  [ECOCUP_DEMO_SETTINGS_KEY,serializeDemoEcocupSettings(plan.nextEcocups)],
  [TILL_CONFIG_KEY,JSON.stringify(validateTillConfig(plan.nextMenus))],
  [OWNER_REVIEW_KEY,JSON.stringify(parseOwnerReviews(JSON.stringify(plan.nextReviews)))]
 ];
 const previous=updates.map(([key])=>[key,storage.getItem(key)]);
 try{
  for(const [key,value] of updates)storage.setItem(key,value);
  if(storage.getItem(DEMO_STORAGE_KEY)!==updates[0][1])throw new Error('Sauvegarde locale non vérifiable.');
 }catch{
  let rollbackFailed=false;
  for(const [key,value] of previous){
   try{if(value===null)storage.removeItem(key);else storage.setItem(key,value);}catch{rollbackFailed=true;}
  }
  throw new Error(rollbackFailed?'Stockage saturé : retour en arrière incomplet. Ne quittez pas cet appareil.':'Espace local insuffisant ou accès bloqué. Les données précédentes ont été conservées.');
 }
}
