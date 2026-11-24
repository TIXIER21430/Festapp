// PRODUCTION-only optimistic persistence. Never call from the live application.
// RLS and the database revision trigger are the final authorization guards.
import {FESTAPP_SUPABASE_URL,FESTAPP_SPACE_ID} from './supabaseSharedRead.js';
// Refuse values JSON would silently drop or rewrite before a shared backup.
function assertJsonSafe(value, ancestors=new Set()){
 if(value===null||typeof value==="string"||typeof value==="boolean")return;
 if(typeof value==="number"&&Number.isFinite(value))return;
 if(typeof value!=="object")throw new TypeError("Données non compatibles JSON.");
 if(ancestors.has(value))throw new TypeError("Données JSON circulaires.");
 const proto=Object.getPrototypeOf(value);
 if(!Array.isArray(value)&&proto!==Object.prototype&&proto!==null)
  throw new TypeError("Données non compatibles JSON.");
 if(Object.getOwnPropertySymbols(value).length)throw new TypeError("Données non compatibles JSON.");
 ancestors.add(value);
 try{
  if(Array.isArray(value)){
   for(let i=0;i<value.length;i++){
    if(!Object.hasOwn(value,i))throw new TypeError("Données JSON incomplètes.");
    assertJsonSafe(value[i],ancestors);
   }
  }else for(const key of Object.keys(value))assertJsonSafe(value[key],ancestors);
 }finally{ancestors.delete(value);}
}
function sortedJSON(value){
 if(Array.isArray(value))return value.map(sortedJSON);
 if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(key=>[key,sortedJSON(value[key])]));
 return value;
}
export function sameProductionSnapshotData(left,right){
 return JSON.stringify(sortedJSON(left))===JSON.stringify(sortedJSON(right));
}
export async function saveProductionSnapshot(client,{spaceId,expectedRevision,payload,productionMode}={}){
 if(productionMode!==true)throw new Error("Écriture interdite hors de l’environnement PRODUCTION.");
 if(typeof spaceId!=="string"||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(spaceId))throw new TypeError("Espace PRODUCTION invalide.");
 // A caller-provided flag alone must never authorize a write to a different project.
 if(client?.supabaseUrl!==FESTAPP_SUPABASE_URL||spaceId!==FESTAPP_SPACE_ID)
  throw new Error("Écriture refusée : projet ou espace Supabase PRODUCTION incorrect.");
 if(!client?.auth?.getUser||!client?.from)throw new TypeError("Client Supabase absent.");
 const {data:userData,error:userError}=await client.auth.getUser();
 if(userError||!userData?.user?.id)throw new Error("Connexion requise avant la sauvegarde.");
 const expected=String(expectedRevision);
 if(!/^[1-9][0-9]*$/.test(expected)||BigInt(expected)>=BigInt(Number.MAX_SAFE_INTEGER))throw new TypeError("Révision invalide.");
 if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new TypeError("Données invalides.");
 assertJsonSafe(payload);
 const {data,error}=await client.from("festapp_snapshots")
  .update({payload,revision:String(BigInt(expected)+1n)})
  .eq("space_id",spaceId).eq("revision",expected)
  .select("revision,updated_at").maybeSingle();
 if(error)throw new Error("Sauvegarde PRODUCTION refusée : vérifiez les droits et la taille des données.");
 if(!data)throw new Error("Conflit de version : rechargez les données partagées avant de réessayer.");
 return {revision:String(data.revision),updatedAt:data.updated_at};
}
