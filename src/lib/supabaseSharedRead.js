// Explicitly read-only: no writes, no automatic sync, no service-role credentials.
import {validateDemoData} from "./demoBackup.js";
import {parseVolunteerNeeds} from "./volunteerNeeds.js";
export const FESTAPP_SPACE_ID="83d56d91-ecee-4d07-8d1f-ca8fd686f0eb";
export const FESTAPP_SUPABASE_URL="https://pomssbugayytzmmgvflg.supabase.co";

export async function readSharedSpace(client,spaceId=FESTAPP_SPACE_ID){
 if(!client?.auth?.getUser||!client?.from)throw new TypeError("Client Supabase absent.");
 const {data:userData,error:userError}=await client.auth.getUser();
 if(userError||!userData?.user?.id)throw new Error("Connectez-vous pour consulter l’espace partagé.");
 const {data:membership,error:memberError}=await client.from("festapp_members").select("space_id").eq("space_id",spaceId).eq("user_id",userData.user.id).maybeSingle();
 if(memberError)throw new Error("Impossible de vérifier l’accès au comité.");
 if(!membership)throw new Error("Ce compte n’a pas encore accès à l’espace du comité.");
 const {data:row,error}=await client.from("festapp_snapshots").select("space_id,revision,payload,updated_at").eq("space_id",spaceId).single();
 if(error||!row||row.space_id!==spaceId)throw new Error("Données partagées indisponibles.");
 const payload=row.payload;
 if(!payload||typeof payload!=="object"||Array.isArray(payload))throw new Error("Format des données partagées invalide.");
 return {revision:String(row.revision),updatedAt:row.updated_at,data:validateDemoData(payload.data||{}),volunteerNeeds:parseVolunteerNeeds(JSON.stringify(payload.volunteerNeeds||{}))};
}
