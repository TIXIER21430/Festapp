import React,{useEffect,useRef,useState} from 'react';
import {getFestappConnection,getSharedFestappClient} from './lib/supabaseClient.js';
import {syncProductionPhotos} from './lib/supabaseProductionPhotos.js';
export default function ProductionPhotoSync({photoRevision,onChange,readOnly}){
 const [status,setStatus]=useState('Photos : vérification…');
 const running=useRef(false),again=useRef(false),callback=useRef(onChange),runRef=useRef(null);
 callback.current=onChange;
 useEffect(()=>{
  if(import.meta.env.VITE_FESTAPP_PRODUCTION_MODE!=='true'||readOnly)return;
  const config=getFestappConnection(),client=getSharedFestappClient();let active=true;
  async function run(){
   if(!active||!navigator.onLine)return;
   if(running.current){again.current=true;return;}
   running.current=true;
   try{
    const result=await syncProductionPhotos(client,{spaceId:config?.spaceId,productionMode:config?.productionMode,active:()=>active});
    if(active){if(result.changed)callback.current?.();setStatus('Photos partagées à jour');}
   }catch(error){if(active)setStatus('Photos en attente : '+(error?.message||'réessai automatique'));}
   finally{running.current=false;if(active&&again.current){again.current=false;void run();}}
  }
  runRef.current=run;void run();
  const timer=setInterval(run,20000);window.addEventListener('online',run);
  const resume=()=>{if(document.visibilityState==='visible')void run();};document.addEventListener('visibilitychange',resume);
  return ()=>{active=false;runRef.current=null;clearInterval(timer);window.removeEventListener('online',run);document.removeEventListener('visibilitychange',resume);};
 },[readOnly]);
 useEffect(()=>{void runRef.current?.();},[photoRevision]);
 if(import.meta.env.VITE_FESTAPP_PRODUCTION_MODE!=='true')return null;
 return <small role="status" style={{display:'block',padding:'4px 12px',textAlign:'center'}}>{readOnly?'Photos : lecture seule':status}</small>;
}
