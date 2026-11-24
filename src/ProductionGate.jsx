import React,{useEffect,useMemo,useState} from 'react';
import {getFestappConnection,getSharedFestappClient} from './lib/supabaseClient.js';
import {readSharedSpace} from './lib/supabaseSharedRead.js';

// The URL fragment is examined only locally. Never log or transmit invite tokens.
const landingType=typeof window==='undefined'?'':new URLSearchParams(window.location.hash.replace(/^#/,'')).get('type');
const needsInitialPassword=landingType==='invite'||landingType==='recovery';

export default function ProductionGate({children}){
 const production=import.meta.env.VITE_FESTAPP_PRODUCTION_MODE==='true';
 const config=useMemo(()=>getFestappConnection(),[]);
 const client=useMemo(()=>getSharedFestappClient(),[]);
 const [session,setSession]=useState(undefined);
 const [stage,setStage]=useState('checking');
 const [email,setEmail]=useState('');
 const [password,setPassword]=useState('');
 const [newPassword,setNewPassword]=useState('');
 const [requiresPassword,setRequiresPassword]=useState(needsInitialPassword);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);

 useEffect(()=>{
  if(!production)return;
  if(!client||!config?.productionMode){setStage('configuration');return;}
  let alive=true;
  const {data:listener}=client.auth.onAuthStateChange((event,next)=>{
   if(!alive)return;
   if(event==='PASSWORD_RECOVERY')setRequiresPassword(true);
   setSession(next);
  });
  client.auth.getSession().then(({data,error})=>{
   if(alive){if(error)setMessage('La session ne peut pas être vérifiée.');setSession(data?.session||null);}
  }).catch(()=>{if(alive){setSession(null);setMessage('Connexion momentanément indisponible.');}});
  return ()=>{alive=false;listener?.subscription?.unsubscribe();};
 },[production,client,config?.productionMode]);

 useEffect(()=>{
  if(!production||!client||!config?.productionMode||session===undefined)return;
  if(!session?.user?.id){setStage('login');return;}
  let active=true;
  setStage('checking');
  readSharedSpace(client,config.spaceId).then(()=>{
   if(active){setStage('ready');setMessage('');}
  }).catch(error=>{
   if(active){setStage('forbidden');setMessage(error?.message||'Accès au comité non autorisé.');}
  });
  return ()=>{active=false;};
 },[production,client,config?.productionMode,config?.spaceId,session?.user?.id]);

 async function signIn(event){
  event.preventDefault();if(busy||!client)return;
  setBusy(true);setMessage('');
  try{
   const {error}=await client.auth.signInWithPassword({email:email.trim(),password});
   if(error)throw error;
   setPassword('');
  }catch{setMessage('Connexion refusée. Vérifie ton adresse et ton mot de passe.');}
  finally{setBusy(false);}
 }
 async function requestReset(){
  if(busy||!client||!email.trim()){setMessage('Indique ton adresse e-mail avant de demander le lien.');return;}
  setBusy(true);setMessage('');
  try{
   const {error}=await client.auth.resetPasswordForEmail(email.trim(),{redirectTo:window.location.origin+window.location.pathname});
   if(error)throw error;
   setMessage('Si ce compte existe, un lien de création ou de réinitialisation du mot de passe vient d’être demandé. Consulte aussi les indésirables.');
  }catch{setMessage('Impossible d’envoyer le lien pour le moment. Réessaie plus tard.');}
  finally{setBusy(false);}
 }
 async function setAccountPassword(event){
  event.preventDefault();if(busy||!client)return;
  if(newPassword.length<12){setMessage('Choisis un mot de passe d’au moins 12 caractères.');return;}
  setBusy(true);setMessage('');
  try{
   const {error}=await client.auth.updateUser({password:newPassword});
   if(error)throw error;
   setNewPassword('');setRequiresPassword(false);
  }catch{setMessage('Le mot de passe n’a pas pu être enregistré. Réessaie ou demande un nouveau lien.');}
  finally{setBusy(false);}
 }
 async function logout(){
  if(busy||!client)return;
  setBusy(true);
  try{await client.auth.signOut();setSession(null);setRequiresPassword(false);setStage('login');setPassword('');setMessage('Déconnecté. Les données locales de cet appareil ne sont pas effacées.');}
  catch{setMessage('Déconnexion impossible.');}
  finally{setBusy(false);}
 }

 if(!production)return children;
 if(stage==='ready'&&!requiresPassword)return <><div className="festapp-auth-strip"><span>🔒 Espace privé du Comité des fêtes de Liernais</span><button type="button" onClick={logout} disabled={busy}>Déconnexion</button></div>{children}</>;
 return <main className="festapp-auth-page"><section className="festapp-auth-card">
  <h1>🎆 FEST’APP</h1><p>Comité des fêtes de Liernais · accès réservé aux membres autorisés.</p>
  {stage==='configuration'&&<p role="alert">Configuration Supabase de production absente. L’application reste fermée pour protéger les données.</p>}
  {stage==='checking'&&<p role="status">Vérification de ton compte et des autorisations…</p>}
  {stage==='forbidden'&&<><p role="alert">Ce compte n’est pas autorisé à consulter l’espace du comité.</p><button type="button" onClick={logout}>Utiliser un autre compte</button></>}
  {stage==='ready'&&requiresPassword&&<form onSubmit={setAccountPassword}>
   <h2>Choisir mon mot de passe FEST’APP</h2>
   <label>Nouveau mot de passe (12 caractères minimum)<input type="password" autoComplete="new-password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} minLength={12} required/></label>
   <button type="submit" disabled={busy}>Enregistrer mon mot de passe</button>
  </form>}
  {stage==='login'&&<form onSubmit={signIn}>
   <h2>Connexion au comité</h2>
   <label>Adresse e-mail<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label>
   <label>Mot de passe<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label>
   <button type="submit" disabled={busy}>Me connecter</button>
   <button type="button" className="secondary" onClick={requestReset} disabled={busy}>Créer ou retrouver mon mot de passe</button>
  </form>}
  {message&&<p role="status">{message}</p>}
  <small>Chaque membre utilise son propre compte. Aucun compte ChatGPT n’est nécessaire pour l’authentification FEST’APP.</small>
 </section></main>;
}
