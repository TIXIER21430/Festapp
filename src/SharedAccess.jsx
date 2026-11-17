import React,{useState} from "react";
import {createFestappClient} from "./lib/supabaseClient.js";
import {readSharedSpace} from "./lib/supabaseSharedRead.js";
const client=createFestappClient();
export default function SharedAccess(){
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [status,setStatus]=useState("");
 const [preview,setPreview]=useState(null);
 const [busy,setBusy]=useState(false);
 async function login(e){
  e.preventDefault();if(!client||busy)return;setBusy(true);setStatus("");setPreview(null);
  try{
   const {error}=await client.auth.signInWithPassword({email:email.trim(),password});
   if(error)throw new Error("Connexion refusée. Vérifiez votre adresse et votre mot de passe.");
   setPassword("");setStatus("Connecté. Vous pouvez vérifier votre accès au comité.");
  }catch(err){setStatus(err.message||"Connexion impossible.");}
  finally{setBusy(false);}
 }
 async function checkAccess(){
  if(!client||busy)return;setBusy(true);setStatus("");setPreview(null);
  try{
   const snapshot=await readSharedSpace(client);
   setPreview({revision:snapshot.revision,updatedAt:snapshot.updatedAt,events:snapshot.data.events?.length||0,volunteers:snapshot.data.shifts?.length||0});
   setStatus("Accès au comité vérifié. Consultation uniquement.");
  }catch(err){setStatus(err.message||"Accès impossible.");}
  finally{setBusy(false);}
 }
 async function logout(){
  if(!client||busy)return;setBusy(true);
  try{await client.auth.signOut();setPreview(null);setPassword("");setStatus("Déconnecté.");}
  catch{setStatus("Déconnexion impossible.");}finally{setBusy(false);}
 }
 return <section className="panel shared-access" aria-label="Accès des membres"><h2>🔐 Espace du comité</h2>
  {!client?<p>La connexion partagée n’est pas encore configurée. La démonstration locale reste disponible.</p>:<>
   <p>Connexion réservée aux membres autorisés. Aucune donnée locale n’est remplacée.</p>
   <form onSubmit={login} className="shared-login"><label>Adresse e-mail<input type="email" autoComplete="username" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Mot de passe<input type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} required/></label><button disabled={busy} type="submit">🔑 Se connecter</button></form>
   <div className="shared-actions"><button type="button" disabled={busy} onClick={checkAccess}>👀 Vérifier mon accès</button><button type="button" className="secondary" disabled={busy} onClick={logout}>Se déconnecter</button></div>
   {preview&&<div className="shared-preview"><strong>✅ Espace accessible</strong><p>{preview.events} manifestation(s) · {preview.volunteers} affectation(s) · version {preview.revision}</p><small>Lecture seule : aucune synchronisation automatique.</small></div>}
   {status&&<p role="status">{status}</p>}
  </>}
 </section>;
}
