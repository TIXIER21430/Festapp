// TEST-only optimistic persistence. Never call from the live application.
// RLS and the database revision trigger are the final authorization guards.
import {FESTAPP_TEST_URL,FESTAPP_TEST_SPACE_ID} from './supabaseClient.js';
function sortedJSON(value){
 if(Array.isArray(value))return value.map(sortedJSON);
 if(value&&typeof value==="object")return Object.fromEntries(Object.keys(value).sort().map(key=>[key,sortedJSON(value[key])]));
 return value;
}
export function sameTestSnapshotData(left,right){
 return JSON.stringify(sortedJSON(left))===JSON.stringify(sortedJSON(right));
}
export async function saveTestSnapshot(client,{spaceId,expectedRevision,payload,testMode}={}){
 if(testMode!==true)throw new Error("Écriture interdite hors de l’environnement TEST.");
 if(typeof spaceId!=="string"||!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(spaceId))throw new TypeError("Espace TEST invalide.");
 // A caller-provided flag alone must never authorize a write to a different project.
 if(client?.supabaseUrl!==FESTAPP_TEST_URL||spaceId!==FESTAPP_TEST_SPACE_ID)
  throw new Error("Écriture refusée : projet ou espace Supabase TEST incorrect.");
 if(!client?.auth?.getUser||!client?.from)throw new TypeError("Client Supabase absent.");
 const {data:userData,error:userError}=await client.auth.getUser();
 if(userError||!userData?.user?.id)throw new Error("Connexion requise avant la sauvegarde.");
 const expected=String(expectedRevision);
 if(!/^[1-9][0-9]*$/.test(expected)||BigInt(expected)>=BigInt(Number.MAX_SAFE_INTEGER))throw new TypeError("Révision invalide.");
 if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new TypeError("Données invalides.");
 const {data,error}=await client.from("festapp_snapshots")
  .update({payload,revision:String(BigInt(expected)+1n)})
  .eq("space_id",spaceId).eq("revision",expected)
  .select("revision,updated_at").maybeSingle();
 if(error)throw new Error("Sauvegarde TEST refusée : vérifiez les droits et la taille des données.");
 if(!data)throw new Error("Conflit de version : rechargez les données partagées avant de réessayer.");
 return {revision:String(data.revision),updatedAt:data.updated_at};
}
