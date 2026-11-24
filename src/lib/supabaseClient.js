import {createClient} from "@supabase/supabase-js";
import {FESTAPP_SPACE_ID,FESTAPP_SUPABASE_URL} from "./supabaseSharedRead.js";
// The TEST project is isolated from the real committee space.
export const FESTAPP_TEST_URL="https://ddpaxzdwxqwypcumjvvn.supabase.co";
export const FESTAPP_TEST_SPACE_ID="d4dbe793-56bb-4dad-a76c-5ac322b1e5b1";
export function getFestappConnection(env=import.meta.env){
 if(env?.VITE_FESTAPP_TEST_MODE==="true"){
  const key=env?.VITE_FESTAPP_TEST_PUBLISHABLE_KEY;
  // Fail closed: never reuse a production key in TEST mode.
  if(typeof key!=="string"||!key.startsWith("sb_publishable_"))return null;
  return {url:FESTAPP_TEST_URL,spaceId:FESTAPP_TEST_SPACE_ID,key,testMode:true};
 }
 // The real space is opt-in only. A generic build must never connect to it by accident.
 if(env?.VITE_FESTAPP_PRODUCTION_MODE!=="true")return null;
 const key=env?.VITE_SUPABASE_PUBLISHABLE_KEY;
 if(typeof key!=="string"||!key.startsWith("sb_publishable_"))return null;
 return {url:FESTAPP_SUPABASE_URL,spaceId:FESTAPP_SPACE_ID,key,testMode:false,productionMode:true};
}
// Publishable keys are safe for a browser. Never use service-role or secret keys here.
export function createFestappClient(env=import.meta.env){
 const config=getFestappConnection(env);
 if(!config)return null;
 return createClient(config.url,config.key,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
}

// Share one auth session/refresh lock between the entry gate and the sync panel.
let sharedClient;
export function getSharedFestappClient(){
 if(!sharedClient)sharedClient=createFestappClient();
 return sharedClient;
}
