import React,{useEffect,useMemo,useRef,useState} from "react";
import {createFestappClient,getFestappConnection} from "./lib/supabaseClient.js";
import {readSharedSpace} from "./lib/supabaseSharedRead.js";
import {saveTestSnapshot} from "./lib/supabaseTestSync.js";
import {makeTestSyncPayload,sameTestPayload,testSyncText,testSyncRecordCount} from "./lib/testSyncPayload.js";

const connection=getFestappConnection();
const client=createFestappClient();

export default function SharedAccess({data={},volunteerNeeds={},ecocupSettings,tillConfig={},onApplyRemote,readOnly=false}){
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [signedIn,setSignedIn]=useState(false);
 const [busy,setBusy]=useState(false);
 const [syncOn,setSyncOn]=useState(false);
 const [status,setStatus]=useState("");
 const [remote,setRemote]=useState(null);
 const [tick,setTick]=useState(0);
 const base=useRef(null);
 const lock=useRef(false);
 const live=useMemo(()=>{
  try{const payload=makeTestSyncPayload({data,volunteerNeeds,ecocupSettings,tillConfig});return {payload,text:testSyncText(payload)};}
  catch{return null;}
 },[data,volunteerNeeds,ecocupSettings,tillConfig]);
 const latest=useRef(live);
 latest.current=live;
 const localCount=live?testSyncRecordCount(live.payload):0;

 useEffect(()=>{
  if(!client)return;
  let active=true;
  client.auth.getUser().then(({data,error})=>{if(active&&!error)setSignedIn(Boolean(data?.user));}).catch(()=>{});
  const {data:subscription}=client.auth.onAuthStateChange((_event,session)=>{
   if(!active)return;
   setSignedIn(Boolean(session?.user));
  });
  return ()=>{active=false;subscription?.subscription?.unsubscribe();};
 },[]);
 useEffect(()=>{
  if(!signedIn){setSyncOn(false);setRemote(null);base.current=null;return;}
  void checkAccess();
 },[signedIn]);

 async function login(e){
  e.preventDefault();if(!client||lock.current)return;
  lock.current=true;setBusy(true);setStatus("");
  try{
   const {error}=await client.auth.signInWithPassword({email:email.trim(),password});
   if(error)throw new Error("Connexion refusée. Vérifie l’e-mail et le mot de passe TEST.");
   setPassword("");setSignedIn(true);
  }catch(error){setStatus("⚠ "+(error.message||"Connexion impossible."));}
  finally{lock.current=false;setBusy(false);}
 }

 async function checkAccess(){
  if(!client||!signedIn||lock.current)return;
  lock.current=true;setBusy(true);
  try{
   const snapshot=await readSharedSpace(client,connection.spaceId);
   setRemote(snapshot);
   if(latest.current&&sameTestPayload(latest.current.payload,snapshot)){
    base.current={revision:snapshot.revision,text:latest.current.text};
    setSyncOn(true);
    setStatus("✅ Les données locales et Supabase TEST sont identiques. Synchronisation automatique active.");
   }else{
    base.current=null;setSyncOn(false);
    setStatus("🟠 Deux versions différentes. Choisis laquelle conserver avant d’activer la synchro. Rien n’a été remplacé.");
   }
  }catch(error){
   base.current=null;setSyncOn(false);setRemote(null);
   setStatus("⚠ "+(error.message||"Accès cloud indisponible.")+" Les saisies locales restent intactes.");
  }finally{lock.current=false;setBusy(false);}
 }

 async function saveToCloud(automatic=false){
  if(!client||!connection?.testMode||!signedIn||readOnly||lock.current||!latest.current)return;
  const beforeBase=base.current;
  if(automatic&&(!syncOn||!beforeBase||latest.current.text===beforeBase.text))return;
  if(!automatic){
   const remoteCount=remote?testSyncRecordCount(remote):0;
   if(!window.confirm(`Envoyer ${localCount} fiches vers Supabase TEST ? La copie distante actuelle (${remoteCount} fiches) sera remplacée, jamais la base de production. Vérifie que tu as téléchargé ton ZIP de sauvegarde. Les photos originales restent locales.`))return;
  }
  lock.current=true;setBusy(true);
  try{
   const existing=await readSharedSpace(client,connection.spaceId);
   const expected=automatic?beforeBase?.revision:remote?.revision;
   if(!expected||existing.revision!==expected)throw new Error("Conflit : la copie cloud a changé. Aucune fiche n’a été écrasée. Recharge les versions.");
   const outgoing=latest.current;
   if(!outgoing)throw new Error("Les données locales ne sont pas valides.");
   if(sameTestPayload(outgoing.payload,existing)){
    base.current={revision:existing.revision,text:outgoing.text};
    setRemote(existing);setSyncOn(true);setStatus("✅ Déjà enregistré dans Supabase TEST.");
    return;
   }
   const saved=await saveTestSnapshot(client,{spaceId:connection.spaceId,expectedRevision:existing.revision,payload:outgoing.payload,testMode:true});
   const after=await readSharedSpace(client,connection.spaceId);
   if(after.revision!==saved.revision||!sameTestPayload(after,outgoing.payload))throw new Error("Envoi non confirmé par la relecture. Contrôle nécessaire avant une nouvelle sauvegarde.");
   base.current={revision:after.revision,text:outgoing.text};
   setRemote(after);setSyncOn(true);
   setStatus(`✅ ${testSyncRecordCount(outgoing.payload)} fiches sauvegardées dans Supabase TEST (révision ${after.revision}). Les prochaines modifications seront envoyées automatiquement.`);
  }catch(error){
   base.current=null;setSyncOn(false);
   setStatus("⚠ "+(error.message||"Synchronisation interrompue.")+" Les modifications restent sur cet appareil.");
  }finally{lock.current=false;setBusy(false);setTick(n=>n+1);}
 }

 async function loadFromCloud(){
  if(!client||!connection?.testMode||!signedIn||readOnly||lock.current||!remote)return;
  if(!window.confirm("Charger la copie Supabase TEST sur CET appareil ? Les fiches et réglages locaux seront remplacés. Fais d’abord une sauvegarde ZIP. Les photos originales ne seront pas supprimées."))return;
  lock.current=true;setBusy(true);
  try{
   const newest=await readSharedSpace(client,connection.spaceId);
   if(newest.revision!==remote.revision)throw new Error("La copie TEST a changé : vérifie de nouveau l’accès avant de charger.");
   if(typeof onApplyRemote!=="function")throw new Error("Restauration locale indisponible.");
   setSyncOn(false);
   onApplyRemote(newest);
   base.current={revision:newest.revision,text:testSyncText(newest)};
   setRemote(newest);setSyncOn(true);
   setStatus(`✅ ${testSyncRecordCount(newest)} fiches récupérées depuis Supabase TEST. Synchronisation automatique activée.`);
  }catch(error){
   base.current=null;setSyncOn(false);
   setStatus("⚠ "+(error.message||"Récupération impossible.")+" Conserve ta sauvegarde locale.");
  }finally{lock.current=false;setBusy(false);setTick(n=>n+1);}
 }

 // Once a chosen baseline is in place, edits are written after a short pause.
 // A version mismatch stops writes: a second device can never be overwritten silently.
 useEffect(()=>{
  if(!syncOn||!signedIn||readOnly||!live||!base.current||live.text===base.current.text)return;
  const timer=setTimeout(()=>{void saveToCloud(true);},1400);
  return ()=>clearTimeout(timer);
 },[syncOn,signedIn,readOnly,live?.text,tick]);

 // Read updates from another device. Only apply them automatically if no
 // unsaved local edit exists. Otherwise ask the user to resolve the conflict.
 useEffect(()=>{
  if(!syncOn||!signedIn||readOnly||!client)return;
  let alive=true;
  const interval=setInterval(async()=>{
   if(!alive||lock.current||!base.current)return;
   lock.current=true;
   try{
    const snapshot=await readSharedSpace(client,connection.spaceId);
    if(snapshot.revision===base.current?.revision)return;
    if(latest.current?.text!==base.current?.text){
     base.current=null;setSyncOn(false);
     setStatus("⚠ Conflit entre deux appareils. Tes modifications locales sont conservées. Vérifie les versions.");
     return;
    }
    if(typeof onApplyRemote!=="function")throw new Error("Chargement indisponible.");
    onApplyRemote(snapshot);
    base.current={revision:snapshot.revision,text:testSyncText(snapshot)};
    setRemote(snapshot);
    setStatus("✅ Modifications de l’autre appareil récupérées depuis Supabase TEST.");
   }catch{
    base.current=null;setSyncOn(false);
    setStatus("⚠ Connexion TEST interrompue. Tes fiches locales sont conservées ; relance la vérification.");
   }finally{lock.current=false;setTick(n=>n+1);}
  },20000);
  return ()=>{alive=false;clearInterval(interval);};
 },[syncOn,signedIn,readOnly,onApplyRemote]);

 async function logout(){
  if(!client||lock.current)return;
  lock.current=true;setBusy(true);
  try{await client.auth.signOut();setSignedIn(false);setSyncOn(false);setRemote(null);base.current=null;setPassword("");setStatus("Déconnecté de Supabase TEST. Tu peux continuer en local.");}
  catch{setStatus("⚠ Déconnexion impossible.");}
  finally{lock.current=false;setBusy(false);}
 }

 return <section className="panel shared-access" aria-label="Sauvegarde et synchronisation Supabase">
  <div className="shared-cloud-heading"><div><span className="shared-cloud-kicker">☁️ Sauvegarde multi-appareils</span><h2>Mes fiches en sécurité</h2><p>Ordinateur et téléphone : une même copie après connexion et activation.</p></div><span className={"shared-sync-pill "+(syncOn?"ready":"offline")}>{syncOn?"✅ Synchronisé":connection?.testMode?"🧪 TEST à connecter":"🔒 Local uniquement"}</span></div>
  {!client?<p className="shared-sync-warning">Connexion Supabase TEST indisponible sur cette version. Les fiches restent sur cet appareil ; télécharge régulièrement une sauvegarde ZIP.</p>:<>
   <p className="shared-mode-note">🧪 Projet Supabase TEST isolé, sans paiement et sans accès pour les autres membres pour le moment. Les photos originales restent sur l’appareil.</p>
   {!signedIn&&<form onSubmit={login} className="shared-login"><label>Adresse e-mail du compte TEST<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Mot de passe TEST<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button disabled={busy} type="submit">🔑 Me connecter</button></form>}
   {!signedIn&&<p className="shared-help">Le compte TEST doit d’abord être créé et autorisé dans Supabase. Il est distinct de ta connexion ChatGPT.</p>}
   {signedIn&&<div className="shared-actions"><span className="shared-session">✅ Compte TEST connecté</span><button type="button" className="secondary" disabled={busy} onClick={()=>void checkAccess()}>🔄 Vérifier les versions</button><button type="button" className="secondary" disabled={busy} onClick={logout}>Me déconnecter</button></div>}
   {remote&&<div className="shared-preview"><strong>Supabase TEST : {testSyncRecordCount(remote)} fiche(s) · révision {remote.revision}</strong><p>Cet appareil : {localCount} fiche(s). {syncOn?"Les modifications sont sauvegardées après chaque saisie.":"Choisis une version pour démarrer sans écraser les données par erreur."}</p><div className="shared-sync-actions"><button type="button" disabled={busy||readOnly||!live||syncOn} onClick={()=>void saveToCloud(false)}>☁️ Envoyer mes fiches vers Supabase</button><button type="button" className="secondary" disabled={busy||readOnly||syncOn} onClick={loadFromCloud}>📲 Récupérer la copie Supabase</button></div></div>}
   {status&&<p role="status" className={syncOn?"shared-sync-ok":"shared-sync-warning"}>{status}</p>}
   <p className="shared-help">⚠ En cas de conflit ou de coupure, tes saisies restent locales : vérifie les versions avant de reprendre. Une sauvegarde ZIP complète est recommandée. Aucun paiement SumUp ni IA payante.</p>
  </>}
 </section>;
}
