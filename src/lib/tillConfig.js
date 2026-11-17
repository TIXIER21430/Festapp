import {TILL_PRODUCTS,productsForEvent} from "./quickTill.js";
export const TILL_CONFIG_KEY="festapp-demo-till-config-v1";
const validId=id=>TILL_PRODUCTS.some(p=>p.id===id);
export function validateTillConfig(value){
 if(!value||typeof value!=="object"||Array.isArray(value))throw new TypeError("Invalid till settings");
 const out={};
 for(const [event,items] of Object.entries(value)){
  if(typeof event!=="string"||event.length>120||!Array.isArray(items)||items.length>TILL_PRODUCTS.length)throw new TypeError("Invalid event menu");
  const ids=new Set();
  out[event]=items.map(item=>{
   if(!item||!validId(item.id)||ids.has(item.id)||!Number.isSafeInteger(item.priceCents)||item.priceCents<0||item.priceCents>100000)throw new TypeError("Invalid product or price");
   ids.add(item.id);
   return {id:item.id,priceCents:item.priceCents};
  });
 }
 return out;
}
export function loadTillConfig(storage){
 try{const raw=storage.getItem(TILL_CONFIG_KEY);return raw?{config:validateTillConfig(JSON.parse(raw)),warning:""}:{config:{},warning:""}}
 catch{return {config:{},warning:"⚠ Réglages de caisse illisibles : aucune modification autorisée avant sauvegarde ou correction."}}
}
export function eventTillProducts(event,config){
 const chosen=config[event];
 if(!chosen)return productsForEvent(event);
 return chosen.map(item=>({...TILL_PRODUCTS.find(p=>p.id===item.id),priceCents:item.priceCents}));
}
export function saveTillConfig(storage,config){
 storage.setItem(TILL_CONFIG_KEY,JSON.stringify(validateTillConfig(config)));
}
