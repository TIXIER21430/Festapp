import React,{useEffect,useState} from "react";
import {createFestappClient,getFestappConnection} from "./lib/supabaseClient.js";
import {readSharedSpace} from "./lib/supabaseSharedRead.js";
import {saveTestSnapshot,sameTestSnapshotData} from "./lib/supabaseTestSync.js";
import {validateDemoData} from "./lib/demoBackup.js";
import {parseVolunteerNeeds} from "./lib/volunteerNeeds.js";
const connection=getFestappConnection();
const client=createFestappClient();
export default function SharedAccess({data={},volunteerNeeds={},readOnly=false}){
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [status,setStatus]=useState("");
 const [preview,setPreview]=useState(null);
 const [busy,setBusy]=useState(false);
 const [signedIn,setSignedIn]=useState(false);
 const localCount=Object.values(data).reduce((sum,rows)=>sum+(Array.isArray(rows)?rows.length:0),0);
 useEffect(()=>{if(!client)return;let active=true;client.auth.getUser().then(({data,error})=>{if(active&&!error)setSignedIn(Boolean(data?.user));}).catch(()=>{});const {data:subscription}=client.auth.onAuthStateChange((_event,session)=>{if(!active)return;setSignedIn(Boolean(session?.user));setPreview(null);});return ()=>{active=false;subscription?.subscription?.unsubscribe();};},[]);
 async function login(e){
  e.preventDefault();if(!client||busy)return;setBusy(true);setStatus("");setPreview(null);
  try{
   const {error}=await client.auth.signInWithPassword({email:email.trim(),password});
   if(error)throw new Error("Connexion refusée. Vérifiez votre adresse et votre mot de passe.");
   setPassword("");setSignedIn(true);setStatus("Connecté. Vous pouvez vérifier votre accès au comité.");
  }catch(err){setStatus(err.message||"Connexion impossible.");}
  finally{setBusy(false);}
 }
 async function checkAccess(){
  if(!client||busy)return;setBusy(true);setStatus("");setPreview(null);
  try{
   const snapshot=await readSharedSpace(client,connection?.spaceId);
   setPreview({revision:snapshot.revision,updatedAt:snapshot.updatedAt,events:snapshot.data.events?.length||0,volunteers:snapshot.data.shifts?.length||0, tasks:snapshot.data.tasks?.length||0,shopping:snapshot.data.shopping?.length||0,stock:snapshot.data.stock?.length||0,recipes:snapshot.data.recipes?.length||0,remoteCount:Object.values(snapshot.data).reduce((sum,rows)=>sum+rows.length,0)});
   setStatus("Accès au comité vérifié. Consultation uniquement.");
  }catch(err){setStatus(err.message||"Accès impossible.");}
  finally{setBusy(false);}
 }
 async function savePrivateTestCopy(){
  if(!client||!connection?.testMode||!signedIn||busy||!preview||readOnly)return;
  let checked,needs;
  try{checked=validateDemoData(data);needs=parseVolunteerNeeds(JSON.stringify(volunteerNeeds));}
  catch{setStatus('⚠ Les données locales ne sont pas valides : aucune copie envoyée.');return;}
  if(!window.confirm(`Envoyer ${localCount} fiche(s) locales dans Supabase TEST ? Cette opération remplace la copie TEST actuelle (${preview.remoteCount} fiches, révision ${preview.revision}), mais ne touche pas au projet réel. Les photos originales ne sont pas incluses. Téléchargez d’abord une sauvegarde JSON.`))return;
  setBusy(true);setStatus('Vérification de la version TEST avant écriture…');
  try{
   const before=await readSharedSpace(client,connection.spaceId);
   if(before.revision!==preview.revision)throw new Error('Conflit : une autre sauvegarde a changé la version TEST. Vérifiez à nouveau votre accès avant de réessayer.');
   const saved=await saveTestSnapshot(client,{spaceId:connection.spaceId,expectedRevision:before.revision,payload:{data:checked,volunteerNeeds:needs},testMode:true});
   const after=await readSharedSpace(client,connection.spaceId);
   if(after.revision!==saved.revision||!sameTestSnapshotData(after.data,checked))throw new Error('Écriture envoyée, mais vérification incomplète : contrôlez la copie TEST avant de continuer.');
   setPreview({revision:after.revision,updatedAt:after.updatedAt,events:after.data.events?.length||0,volunteers:after.data.shifts?.length||0,tasks:after.data.tasks?.length||0,shopping:after.data.shopping?.length||0,stock:after.data.stock?.length||0,recipes:after.data.recipes?.length||0,remoteCount:Object.values(after.data).reduce((sum,rows)=>sum+rows.length,0)});
   setStatus(`✅ ${localCount} fiche(s) enregistrée(s) et relue(s) dans Supabase TEST. Aucune donnée envoyée au projet réel.`);
  }catch(err){setPreview(null);setStatus('⚠ '+(err.message||'Sauvegarde TEST impossible. Aucune confirmation de succès.'));}
  finally{setBusy(false);}
 }
 async function logout(){
  if(!client||busy)return;setBusy(true);
  try{await client.auth.signOut();setPreview(null);setPassword("");setSignedIn(false);setStatus("Déconnecté.");}
  catch{setStatus("Déconnexion impossible.");}finally{setBusy(false);}
 }
 return <section className="panel shared-access" aria-label="Accès des membres"><h2>🔐 Espace du comité {connection?.testMode?"🧪 TEST":""}</h2>
  {!client?<p>Connexion partagée désactivée sur cette installation. Le remplissage local reste disponible, sans transfert vers la base réelle.</p>:<>
   <p>{connection?.testMode?"Environnement de test séparé : aucune donnée du comité réel n’est modifiée.":"Connexion réservée aux membres autorisés. Aucune donnée locale n’est remplacée."}</p>
   {!signedIn&&<form onSubmit={login} className="shared-login"><label>Adresse e-mail<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Mot de passe<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button disabled={busy} type="submit">🔑 Se connecter</button></form>}
   {signedIn&&<p className="shared-session">✅ Session active sur cet appareil</p>}
   <div className="shared-actions"><button type="button" disabled={busy||!signedIn} onClick={checkAccess}>👀 Vérifier mon accès</button><button type="button" className="secondary" disabled={busy||!signedIn} onClick={logout}>Se déconnecter</button></div>
   {preview&&<div className="shared-preview"><strong>✅ Espace accessible</strong><div className="shared-preview-grid">{[["🎉","Manifestations",preview.events],["✅","Tâches",preview.tasks],["🛒","Achats",preview.shopping],["📦","Stock",preview.stock],["🍲","Recettes",preview.recipes],["👥","Affectations",preview.volunteers]].map(([icon,label,count])=><div className="shared-preview-tile" key={label}><span aria-hidden="true">{icon}</span><strong>{count}</strong><small>{label}</small></div>)}</div><p>Révision TEST : {preview.revision} · {preview.remoteCount} fiches dans la copie distante · {localCount} fiches locales.</p><small>La consultation ne remplace jamais tes données locales. Les éventuelles écritures TEST sont volontaires et vérifiées.</small></div>}
   {connection?.testMode&&<div className="shared-test-backup"><p><strong>🧪 Copie de sécurité TEST (optionnelle)</strong></p><p>Après avoir vérifié ton accès, tu peux enregistrer volontairement les fiches dans le projet TEST isolé. Cette fonction n’active ni le partage entre les membres ni la base réelle.</p><button type="button" disabled={busy||!signedIn||!preview||readOnly} onClick={savePrivateTestCopy}>💾 Enregistrer ma copie dans Supabase TEST</button></div>}
   {status&&<p role="status">{status}</p>}
  </>}
 </section>;
}
