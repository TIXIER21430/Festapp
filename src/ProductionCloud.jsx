import React,{useEffect,useMemo,useRef,useState} from 'react';
import {getFestappConnection,getSharedFestappClient} from './lib/supabaseClient.js';
import {readSharedSpace} from './lib/supabaseSharedRead.js';
import {readProductionPrivateDriveCatalog} from './lib/supabaseProductionDrive.js';
import {saveProductionSnapshot} from './lib/supabaseProductionSync.js';
import {saveProductionFullBackup,downloadLatestProductionFullBackup} from './lib/supabaseProductionBackup.js';
import {makeTestSyncPayload,sameTestPayload,testSyncText,testSyncRecordCount} from './lib/testSyncPayload.js';

import {decideProductionSync,readProductionBaseline,rememberProductionBaseline} from './lib/productionAutoSync.js';

const connection=getFestappConnection();
const client=getSharedFestappClient();
const BACKUP_KEY='festapp-production-private-backup-enabled';
const ARCHIVE_INTERVAL=15*60*1000;
const BASELINE_KEY='festapp-production-confirmed-v1:'+connection?.spaceId;

export default function ProductionCloud({data={},volunteerNeeds={},ecocupSettings,tillConfig={},onApplyRemote,onDriveCatalog,prepareCompleteBackup,photoRevision=0,readOnly=false,pristineText=null,canApplyRemote=true}){
 const [signedIn,setSignedIn]=useState(false);
 const [remote,setRemote]=useState(null);
 const [syncOn,setSyncOn]=useState(false);
 const [status,setStatus]=useState('Vérification des données partagées…');
 const [busy,setBusy]=useState(false);
 const [tick,setTick]=useState(0);
 const [archiveBusy,setArchiveBusy]=useState(false);
 const [archiveStatus,setArchiveStatus]=useState('');
 const [archiveTick,setArchiveTick]=useState(0);
 const [archiveEnabled,setArchiveEnabled]=useState(()=>{try{return localStorage.getItem(BACKUP_KEY)!=='no';}catch{return true;}});
 const lock=useRef(false),archiveLock=useRef(false),base=useRef(null),epoch=useRef(0);
 const lastArchive=useRef({signature:'',time:0}),failedArchive=useRef('');
 const live=useMemo(()=>{
  try{const payload=makeTestSyncPayload({data,volunteerNeeds,ecocupSettings,tillConfig});return {payload,text:testSyncText(payload)};}
  catch{return null;}
 },[data,volunteerNeeds,ecocupSettings,tillConfig]);
 const latest=useRef(live);latest.current=live;
 const applyRef=useRef(onApplyRemote);applyRef.current=onApplyRemote;
 const safeApply=useRef(canApplyRemote);safeApply.current=canApplyRemote;
 function confirmBaseline(snapshot,text=testSyncText(snapshot)){
  base.current={revision:snapshot.revision,text};
  rememberProductionBaseline(localStorage,BASELINE_KEY,base.current);
 }
 const pending=syncOn&&(!live||!base.current||live.text!==base.current.text);

 useEffect(()=>{
  if(!client||!connection?.productionMode)return;
  let active=true;
  client.auth.getUser().then(({data,error})=>{if(active)setSignedIn(!error&&!!data?.user);}).catch(()=>{});
  const {data:subscription}=client.auth.onAuthStateChange((_event,session)=>{if(active)setSignedIn(!!session?.user);});
  return ()=>{active=false;subscription?.subscription?.unsubscribe();};
 },[]);

 useEffect(()=>{
  const token=++epoch.current;
  if(!signedIn){setRemote(null);setSyncOn(false);base.current=null;onDriveCatalog?.(null);return;}
  void refresh(token);
  return ()=>{epoch.current++;};
 },[signedIn]);

 async function refresh(token=epoch.current,includeCatalog=true){
  if(!client||!connection?.productionMode||lock.current)return;
  lock.current=true;setBusy(true);
  try{
   const snapshot=await readSharedSpace(client,connection.spaceId);
   if(token!==epoch.current)return;
   setRemote(snapshot);
   if(includeCatalog)try{
    const catalog=await readProductionPrivateDriveCatalog(client,{spaceId:connection.spaceId,productionMode:true});
    if(token===epoch.current)onDriveCatalog?.(catalog);
   }catch{if(token===epoch.current)onDriveCatalog?.(null);}
   if(token!==epoch.current)return;
   if(readOnly||!latest.current){base.current=null;setSyncOn(false);setStatus('⚠ Données locales illisibles : synchronisation bloquée pour éviter une perte.');return;}
   const local=latest.current;
   const remoteText=testSyncText(snapshot);
   const baseline=base.current||readProductionBaseline(localStorage,BASELINE_KEY);
   const decision=decideProductionSync({localText:local.text,remoteText,remoteRevision:snapshot.revision,baseline,pristine:!!pristineText&&local.text===pristineText,remoteHasRecords:testSyncRecordCount(snapshot)>0});
   if(decision==='same'){
    confirmBaseline(snapshot,local.text);setSyncOn(true);
    setStatus('✅ Fiches synchronisées automatiquement.');
   }else if(decision==='send'){
    confirmBaseline(snapshot,remoteText);setSyncOn(true);
    setStatus('⏳ Modifications locales en attente d’enregistrement.');
   }else if(decision==='receive'){
    if(!safeApply.current||typeof applyRef.current!=='function'){
     setSyncOn(false);setStatus('⏳ Nouvelle version disponible. Termine ta saisie pour la recevoir automatiquement.');return;
    }
    applyRef.current(snapshot,true);confirmBaseline(snapshot,remoteText);setSyncOn(true);
    setStatus('✅ Dernières fiches du comité récupérées automatiquement.');
   }else{
    base.current=null;setSyncOn(false);
    setStatus('🟠 Les deux copies diffèrent. Tes modifications locales sont conservées. Choisis une version uniquement après vérification.');
   }
  }catch(error){
   if(token!==epoch.current)return;
   base.current=null;setSyncOn(false);setRemote(null);onDriveCatalog?.(null);
   setStatus('⚠ '+(error?.message||'Impossible de vérifier les données partagées.')+' Tes données locales sont conservées.');
  }finally{lock.current=false;setBusy(false);setTick(n=>n+1);}
 }

 async function save(automatic=false){
  if(!client||!connection?.productionMode||!signedIn||readOnly||lock.current||!latest.current)return;
  const previous=base.current;
  if(automatic&&(!syncOn||!previous||latest.current.text===previous.text))return;
  if(!automatic&&!window.confirm('Remplacer la copie partagée du comité par les fiches de cet appareil ? Les autres membres verront ce changement. Vérifie ta sauvegarde avant de confirmer.'))return;
  lock.current=true;setBusy(true);
  try{
   const before=await readSharedSpace(client,connection.spaceId);
   const expected=automatic?previous?.revision:remote?.revision;
   if(!expected||before.revision!==expected)throw new Error('Conflit : un autre appareil a modifié la copie. Aucune donnée n’a été écrasée.');
   const outgoing=latest.current;
   if(!outgoing)throw new Error('Données locales invalides.');
   if(sameTestPayload(outgoing.payload,before)){
    confirmBaseline(before,outgoing.text);setRemote(before);setSyncOn(true);
    setStatus('✅ Déjà enregistré sur Supabase.');return;
   }
   const result=await saveProductionSnapshot(client,{spaceId:connection.spaceId,expectedRevision:before.revision,payload:outgoing.payload,productionMode:true});
   const after=await readSharedSpace(client,connection.spaceId);
   if(after.revision!==result.revision||!sameTestPayload(after,outgoing.payload))
    throw new Error('Relecture du serveur différente : sauvegarde non confirmée.');
   confirmBaseline(after,outgoing.text);setRemote(after);setSyncOn(true);
   setStatus('✅ '+testSyncRecordCount(outgoing.payload)+' fiches enregistrées sur Supabase, révision '+after.revision+'.');
  }catch(error){
   base.current=null;setSyncOn(false);
   setStatus('⚠ '+(error?.message||'Envoi interrompu.')+' Les modifications locales sont conservées.');
  }finally{lock.current=false;setBusy(false);setTick(n=>n+1);}
 }

 async function load(){
  if(!client||!signedIn||readOnly||lock.current||!remote)return;
  if(!window.confirm('Récupérer la copie du comité sur cet appareil ? Les fiches et réglages locaux seront remplacés. Les photos locales ne seront pas supprimées.'))return;
  lock.current=true;setBusy(true);
  try{
   const snapshot=await readSharedSpace(client,connection.spaceId);
   if(snapshot.revision!==remote.revision)throw new Error('La copie a changé. Vérifie les versions avant de recommencer.');
   if(typeof onApplyRemote!=='function')throw new Error('Restauration locale indisponible.');
   setSyncOn(false);onApplyRemote(snapshot);
   confirmBaseline(snapshot);setRemote(snapshot);setSyncOn(true);
   setStatus('✅ '+testSyncRecordCount(snapshot)+' fiches chargées depuis le comité. Synchronisation active.');
  }catch(error){base.current=null;setSyncOn(false);setStatus('⚠ '+(error?.message||'Chargement impossible.'));}
  finally{lock.current=false;setBusy(false);setTick(n=>n+1);}
 }

 useEffect(()=>{
  if(!signedIn||!syncOn||readOnly||!live||!base.current||live.text===base.current.text)return;
  const timer=setTimeout(()=>{void save(true);},1400);
  return ()=>clearTimeout(timer);
 },[signedIn,syncOn,readOnly,live?.text,tick]);

 // Refresh even after a temporary network failure. The confirmed baseline
 // prevents a stale cache or concurrent local edits from overwriting either copy.
 useEffect(()=>{
  if(!signedIn||readOnly||!client)return;
  const resume=()=>{if(document.visibilityState==='visible')void refresh(epoch.current,false);};
  const timer=setInterval(async()=>{if(document.visibilityState==='visible')await refresh(epoch.current,false);},20000);
  window.addEventListener('online',resume);
  document.addEventListener('visibilitychange',resume);
  return ()=>{clearInterval(timer);window.removeEventListener('online',resume);document.removeEventListener('visibilitychange',resume);};
 },[signedIn,readOnly,pristineText]);

 async function archive(force=false){
  if(!archiveEnabled||!client||!signedIn||!syncOn||readOnly||archiveLock.current||lock.current||typeof prepareCompleteBackup!=='function')return;
  const revision=base.current?.revision;
  if(!revision||!latest.current||latest.current.text!==base.current.text){
   if(force)setArchiveStatus('⚠ Attends la confirmation des fiches avant d’archiver les photos.');
   return;
  }
  const signature=revision+':'+photoRevision;
  if(!force&&(lastArchive.current.signature===signature||failedArchive.current===signature))return;
  archiveLock.current=true;setArchiveBusy(true);setArchiveStatus('⏳ Préparation du ZIP privé avec photos…');
  try{
   const {zip,photos,records}=await prepareCompleteBackup();
   if(base.current?.revision!==revision||latest.current?.text!==base.current.text)
    throw new Error('Les fiches ont changé pendant la préparation.');
   await saveProductionFullBackup(client,{spaceId:connection.spaceId,backup:zip,productionMode:true});
   lastArchive.current={signature,time:Date.now()};failedArchive.current='';
   setArchiveStatus('✅ Archive privée vérifiée : '+records+' fiches, '+photos+' photos.');
  }catch(error){failedArchive.current=signature;setArchiveStatus('⚠ Archive non confirmée : '+(error?.message||'erreur réseau')+'. Garde une copie locale.');}
  finally{archiveLock.current=false;setArchiveBusy(false);setArchiveTick(n=>n+1);}
 }
 async function download(){
  if(!client||!signedIn||archiveLock.current)return;
  archiveLock.current=true;setArchiveBusy(true);
  try{
   const {blob,name}=await downloadLatestProductionFullBackup(client,{spaceId:connection.spaceId,productionMode:true});
   const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();
   setTimeout(()=>URL.revokeObjectURL(url),60000);
   setArchiveStatus('📥 ZIP téléchargé. Vérifie les Téléchargements de cet appareil.');
  }catch(error){setArchiveStatus('⚠ '+(error?.message||'Téléchargement impossible.'));}
  finally{archiveLock.current=false;setArchiveBusy(false);setArchiveTick(n=>n+1);}
 }
 useEffect(()=>{
  if(!archiveEnabled||!syncOn||!signedIn||readOnly||!live||!base.current||pending||archiveLock.current)return;
  const signature=base.current.revision+':'+photoRevision;
  if(lastArchive.current.signature===signature||failedArchive.current===signature)return;
  const delay=Math.max(8000,ARCHIVE_INTERVAL-(Date.now()-lastArchive.current.time));
  const timer=setTimeout(()=>{void archive();},delay);
  return ()=>clearTimeout(timer);
 },[archiveEnabled,syncOn,signedIn,readOnly,live?.text,photoRevision,tick,archiveTick]);
 useEffect(()=>{const resume=()=>{if(document.visibilityState==='visible')setArchiveTick(n=>n+1);};document.addEventListener('visibilitychange',resume);return ()=>document.removeEventListener('visibilitychange',resume);},[]);

 return <section className="panel shared-access" aria-label="Sauvegarde et synchronisation du comité">
  <div className="shared-cloud-heading"><div><span className="shared-cloud-kicker">☁️ Espace privé du comité</span><h2>Fiches et sauvegardes</h2><p>Les mêmes fiches sur ordinateur et téléphone, mises à jour automatiquement.</p></div><span className={'shared-sync-pill '+(syncOn&&!pending?'ready':'offline')}>{syncOn?(pending?'⏳ Enregistrement en attente':'✅ Fiches synchronisées'):'🔒 À vérifier'}</span></div>
  {!client||!connection?.productionMode?<p role="alert">Configuration de production absente : aucun accès cloud autorisé.</p>:<>
   <p>Les fiches et photos originales sont partagées dans l’espace privé. Les ZIP restent disponibles en complément de l’historique serveur.</p>
   {remote&&<div className="shared-preview"><strong>Copie du comité : {testSyncRecordCount(remote)} fiches · révision {remote.revision}</strong><p>Cet appareil : {live?testSyncRecordCount(live.payload):'inconnu'} fiches.</p><div className="shared-sync-actions"><button type="button" disabled={busy||readOnly||syncOn||!live} onClick={()=>void save(false)}>☁️ Envoyer mes fiches</button><button type="button" className="secondary" disabled={busy||readOnly||syncOn} onClick={load}>📲 Récupérer la copie du comité</button><button type="button" className="secondary" disabled={busy} onClick={()=>void refresh()}>🔄 Vérifier les versions</button></div></div>}
   {status&&<p role="status" className={syncOn?'shared-sync-ok':'shared-sync-warning'}>{status}</p>}
   {signedIn&&<div className="shared-preview"><strong>📦 ZIP privé avec photos et documents locaux</strong><p>Une archive est créée après synchronisation et à chaque changement, avec au moins 15 minutes entre deux archives, lorsque l’application est ouverte.</p><div className="shared-sync-actions"><button type="button" className="secondary" disabled={archiveBusy||busy||readOnly||pending||!syncOn} onClick={()=>void archive(true)}>☁️ Archiver maintenant</button><button type="button" className="secondary" disabled={archiveBusy} onClick={download}>📥 Télécharger mon dernier ZIP</button><button type="button" className="secondary" onClick={()=>{try{localStorage.setItem(BACKUP_KEY,archiveEnabled?'no':'yes');}catch{}setArchiveEnabled(!archiveEnabled);}}>{archiveEnabled?'Désactiver archives automatiques':'Activer archives automatiques'}</button></div>{archiveStatus&&<p role="status">{archiveStatus}</p>}</div>}
   <p className="shared-help">⚠ Une connexion et des droits de membre sont obligatoires. En cas de conflit, rien n’est écrasé automatiquement. Les ZIP restent privés et sont accessibles à leur auteur.</p>
  </>}
 </section>;
}
