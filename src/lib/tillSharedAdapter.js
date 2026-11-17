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
   return data.map(row=>({eventName:row.event_name,menu:row.menu,updatedAt:row.updated_at}));
  },
  async save(eventName,menu){
   const userId=await requireUser();
   if(typeof eventName!=="string"||eventName.length<1||eventName.length>120)throw new TypeError("Invalid event");
   const {validateTillConfig}=await import("./tillConfig.js");
   const checked=validateTillConfig({[eventName]:menu})[eventName];
   const {error}=await client.from(SHARED_TILL_TABLE).upsert({event_name:eventName,menu:checked,updated_by:userId},{onConflict:"event_name"});
   if(error)throw new Error("Shared till write failed");
  },
  subscribe(onChange){
   if(typeof onChange!=="function")throw new TypeError("Invalid callback");
   const channel=client.channel("fest-till-menus").on("postgres_changes",{event:"*",schema:"public",table:SHARED_TILL_TABLE},()=>onChange()).subscribe();
   return ()=>{void client.removeChannel(channel)};
  }
 });
}
