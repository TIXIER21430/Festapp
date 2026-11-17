import React,{useEffect,useState} from "react";
import {createFestappClient} from "./lib/supabaseClient.js";
import {readSharedSpace} from "./lib/supabaseSharedRead.js";
const client=createFestappClient();
export default function SharedAccess(){
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [status,setStatus]=useState("");
 const [preview,setPreview]=useState(null);
 const [busy,setBusy]=useState(false);
 const [signedIn,setSignedIn]=useState(false);
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
   const snapshot=await readSharedSpace(client);
   setPreview({revision:snapshot.revision,updatedAt:snapshot.updatedAt,events:snapshot.data.events?.length||0,volunteers:snapshot.data.shifts?.length||0, tasks:snapshot.data.tasks?.length||0,shopping:snapshot.data.shopping?.length||0,stock:snapshot.data.stock?.length||0,recipes:snapshot.data.recipes?.length||0});
   setStatus("Accès au comité vérifié. Consultation uniquement.");
  }catch(err){setStatus(err.message||"Accès impossible.");}
  finally{setBusy(false);}
 }
 async function logout(){
  if(!client||busy)return;setBusy(true);
  try{await client.auth.signOut();setPreview(null);setPassword("");setSignedIn(false);setStatus("Déconnecté.");}
  catch{setStatus("Déconnexion impossible.");}finally{setBusy(false);}
 }
 return <section className="panel shared-access" aria-label="Accès des membres"><h2>🔐 Espace du comité</h2>
  {!client?<p>La connexion partagée n’est pas encore configurée. La démonstration locale reste disponible.</p>:<>
   <p>Connexion réservée aux membres autorisés. Aucune donnée locale n’est remplacée.</p>
   {!signedIn&&<form onSubmit={login} className="shared-login"><label>Adresse e-mail<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Mot de passe<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button disabled={busy} type="submit">🔑 Se connecter</button></form>}
   {signedIn&&<p className="shared-session">✅ Session active sur cet appareil</p>}
   <div className="shared-actions"><button type="button" disabled={busy||!signedIn} onClick={checkAccess}>👀 Vérifier mon accès</button><button type="button" className="secondary" disabled={busy||!signedIn} onClick={logout}>Se déconnecter</button></div>
   {preview&&<div className="shared-preview"><strong>✅ Espace accessible</strong><div className="shared-preview-grid">{[["🎉","Manifestations",preview.events],["✅","Tâches",preview.tasks],["🛒","Achats",preview.shopping],["📦","Stock",preview.stock],["🍲","Recettes",preview.recipes],["👥","Affectations",preview.volunteers]].map(([icon,label,count])=><div className="shared-preview-tile" key={label}><span aria-hidden="true">{icon}</span><strong>{count}</strong><small>{label}</small></div>)}</div><p>Version partagée : {preview.revision}</p><small>Consultation uniquement : les données locales ne sont ni envoyées ni remplacées.</small></div>}
   {status&&<p role="status">{status}</p>}
  </>}
 </section>;
}
