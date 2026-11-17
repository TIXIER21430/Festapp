import {createClient} from "@supabase/supabase-js";
import {FESTAPP_SUPABASE_URL} from "./supabaseSharedRead.js";
// The publishable key is safe for a browser. Never use a service-role or secret key here.
export function createFestappClient(env=import.meta.env){
 const key=env?.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(typeof key!=="string"||!key.trim())return null;
 return createClient(FESTAPP_SUPABASE_URL,key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:false}});
}
