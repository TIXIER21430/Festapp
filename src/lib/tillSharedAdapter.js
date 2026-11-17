// Shared till menu adapter for an independently confirmed TEST Supabase project.
// Does not initialize a client, change database schema, or access production.
export const SHARED_TILL_TABLE="fest_till_menus";
export function createTillSharedAdapter(client,{testProjectConfirmed=false}={}){
 if(testProjectConfirmed!==true)throw new Error("Independent TEST project confirmation required");
 if(!client||typeof client.from!=="function"||!client.auth||typeof client.auth.getUser!=="function")throw new TypeError("Invalid test client");
 async function requireUser(){
  const {data,error}=await client.auth.getUser();
  if(error||!data?.user?.id)throw new Error("Authentication required");
  return data.user.id;
 }
 return Object.freeze({
  async list(){
   await requireUser();
   const {data,error}=await client.from(SHARED_TILL_TABLE).select("event_name,menu,updated_at").limit(100);
   if(error)throw new Error("Shared till read failed");
   if(!Array.isArray(data))throw new Error("Shared till read failed");
   const {validateTillConfig}=await import("./tillConfig.js");
   return data.map(row=>({eventName:row.event_name,menu:validateTillConfig({[row.event_name]:row.menu})[row.event_name],updatedAt:row.updated_at}));
  },
  async save(eventName,menu,{expectedUpdatedAt=null}={}){
   const userId=await requireUser();
   if(typeof eventName!=="string"||eventName.length<1||eventName.length>120)throw new TypeError("Invalid event");
   const {validateTillConfig}=await import("./tillConfig.js");
   const checked=validateTillConfig({[eventName]:menu})[eventName];
   if(expectedUpdatedAt!==null){
    if(typeof expectedUpdatedAt!=="string"||!Number.isFinite(Date.parse(expectedUpdatedAt)))throw new TypeError("Invalid revision");
    const {data,error}=await client.from(SHARED_TILL_TABLE)
     .update({menu:checked,updated_by:userId,updated_at:new Date().toISOString()})
     .eq("event_name",eventName).eq("updated_at",expectedUpdatedAt)
     .select("event_name,updated_at");
    if(error)throw new Error("Shared till write failed");
    if(!Array.isArray(data)||data.length!==1)throw new Error("Menu changed elsewhere: reload before saving");
    return data[0].updated_at;
   }
   // Creation only: never overwrite an existing event without its revision.
   const {data,error}=await client.from(SHARED_TILL_TABLE)
    .insert({event_name:eventName,menu:checked,updated_by:userId})
    .select("event_name,updated_at");
   if(error)throw new Error("Shared till create failed: event may already exist");
   if(!Array.isArray(data)||data.length!==1)throw new Error("Shared till create failed");
   return data[0].updated_at;
  },
  subscribe(onChange){
   if(typeof onChange!=="function")throw new TypeError("Invalid callback");
   const channel=client.channel("fest-till-menus").on("postgres_changes",{event:"*",schema:"public",table:SHARED_TILL_TABLE},()=>onChange()).subscribe();
   return ()=>{void client.removeChannel(channel)};
  }
 });
}
