import React,{useEffect,useState} from 'react';
import {getFestappConnection,getSharedFestappClient} from './lib/supabaseClient.js';
export default function ProductionMemberInvites(){
 const [rows,setRows]=useState(null),[busy,setBusy]=useState(false),[status,setStatus]=useState('');
 const client=getSharedFestappClient(),spaceId=getFestappConnection()?.spaceId;
 async function refresh(){
  if(!client||!spaceId)return;
  const {data,error}=await client.from('festapp_pending_members').select('status').eq('space_id',spaceId);
  if(!error)setRows(data||[]);
 }
 useEffect(()=>{void refresh();},[]);
 if(!rows?.length)return null;
 const pending=rows.filter(r=>r.status==='pending').length,invited=rows.filter(r=>r.status==='invited').length,review=rows.length-pending-invited;
 async function invite(){
  if(busy||!pending||!window.confirm('Confirme que tu as vérifié sur ordinateur ET téléphone la connexion, la récupération des fiches et des photos. Envoyer maintenant les invitations aux '+pending+' membres préparés ?'))return;
  setBusy(true);setStatus('Envoi des invitations…');
  try{
   const {data,error}=await client.functions.invoke('festapp-invite-members',{body:{confirm:'INVITER_APRES_VALIDATION'}});
   if(error||!data||data.error)throw Error('Envoi non confirmé. Vérifie les statuts avant de recommencer.');
   setStatus(data.invited+' invitation(s) envoyée(s). '+data.review+' à vérifier.');
  }catch(error){setStatus(error.message);}
  finally{await refresh();setBusy(false);}
 }
 return <div className="shared-preview"><strong>👥 Accès des membres du bureau</strong><p>{pending} invitation(s) prête(s) · {invited} envoyée(s) · {review} à vérifier.</p><p>Après le test sur deux appareils, les membres recevront chacun leur lien pour choisir leur mot de passe.</p><button type="button" disabled={busy||!pending} onClick={invite}>Inviter les {pending} membres</button>{status&&<p role="status">{status}</p>}</div>;
}
