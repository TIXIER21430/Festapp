import React,{useMemo,useState} from 'react';
import {OWNER_REVIEW_KEY,parseOwnerReviews,summarizeOwnerReviews} from './lib/ownerSetup.js';
import {auditOwnerReadiness} from './lib/ownerReadinessAudit.js';

export default function OwnerSetup({data,onOpen,onBackup,onFullBackup,ecocupSettings,readOnly=false}){
 const [reviews,setReviews]=useState(()=>{try{return parseOwnerReviews(localStorage.getItem(OWNER_REVIEW_KEY));}catch{return {};}});
 const [warning,setWarning]=useState('');
 const [backupStatus,setBackupStatus]=useState('');
 const [backupBusy,setBackupBusy]=useState(false);
 const {items,checked,total}=useMemo(()=>summarizeOwnerReviews(data,reviews,{ecocups:ecocupSettings}),[data,reviews,ecocupSettings?.opening,ecocupSettings?.threshold]);
 const {issues,count:issueCount}=useMemo(()=>auditOwnerReadiness(data,{ecocups:ecocupSettings}),[data,ecocupSettings?.opening]);
 function toggle(key){
  if(readOnly)return;
  const next={...reviews};
  const item=items.find(x=>x.key===key);
  if(!item)return;
  if(item.checked)delete next[key];else next[key]={checked:true,at:new Date().toISOString(),fingerprint:item.fingerprint};
  try{localStorage.setItem(OWNER_REVIEW_KEY,JSON.stringify(next));setReviews(next);setWarning('');}
  catch{setWarning('Impossible de mémoriser les vérifications sur cet appareil. Exportez vos données avant de le quitter.');}
 }
 async function downloadEverything(){
  if(backupBusy||readOnly)return;
  setBackupBusy(true);setBackupStatus('Préparation de la sauvegarde complète…');
  try{setBackupStatus(await onFullBackup());}
  catch(error){setBackupStatus('⚠ Sauvegarde complète non créée : '+(error.message||'erreur inconnue'));}
  finally{setBackupBusy(false);}
 }
 return <section className="owner-setup" aria-label="Préparer FEST’APP avant de la partager">
  <div className="owner-setup-heading"><div><span className="owner-setup-pill">🔒 Préparation privée</span><h2>Je remplis et je vérifie mon appli</h2><p>Avance rubrique par rubrique. <strong>Rien n’est partagé aux membres du bureau.</strong></p></div><div className="owner-progress" role="status"><strong>{checked} / {total}</strong><span>rubriques vérifiées</span></div></div>
  <div className="owner-setup-tools"><button type="button" disabled={readOnly||backupBusy} onClick={downloadEverything}>📦 {backupBusy?'Préparation du ZIP…':'Sauvegarde complète (fiches + photos)'}</button><button type="button" disabled={readOnly} className="owner-backup-secondary" onClick={onBackup}>💾 JSON seul</button><small>Garde une copie privée après chaque session.</small></div>
  {backupStatus&&<p role="status" className="owner-backup-status">{backupStatus}</p>}
  <progress value={checked} max={total} aria-label="Progression de la vérification de FEST’APP"/>
  <div className="owner-audit" aria-label="Suggestions de saisie avant partage">
   <div className="owner-audit-heading"><div><span className="owner-audit-kicker">🔎 Contrôle guidé</span><h3>Les prochains points à compléter</h3><p>Ces pistes sont calculées sur tes fiches. Les modèles historiques peuvent rester incomplets : c’est toi qui décides ce qui est utile pour la prochaine fête.</p></div><span className="owner-audit-count" role="status">{issueCount===0?'Aucune piste détectée':issueCount+' piste(s)'}</span></div>
   {issueCount===0?<p className="owner-audit-empty">🌟 Aucun champ manquant parmi les vérifications simples. Continue la relecture manuelle des 13 rubriques avant de partager.</p>:<div className="owner-audit-grid">{issues.map(issue=><article className="owner-audit-card" key={issue.id}><span className="owner-audit-icon" aria-hidden="true">{issue.icon}</span><div><small>{issue.kind}</small><h4>{issue.title}</h4><p>{issue.detail}</p><button type="button" onClick={()=>onOpen(issue.key)} aria-label={'Compléter : '+issue.title}>✏️ Ouvrir la rubrique</button></div></article>)}</div>}
   <p className="owner-audit-note">ℹ️ Ce contrôle n’envoie aucune donnée, ne coche aucune rubrique automatiquement et ne donne accès à personne.</p>
  </div>
  <div className="owner-setup-grid">{items.map(item=><article className="owner-setup-item" key={item.key}>
    <div className="owner-setup-item-top"><span aria-hidden="true">{item.icon}</span><div><strong>{item.label}</strong><small>{item.count} fiche(s)</small></div><label className="owner-review-check"><input type="checkbox" checked={item.checked} disabled={readOnly} onChange={()=>toggle(item.key)} aria-label={'J’ai vérifié : '+item.label}/> Vérifié</label></div>
    <p>{item.hint}</p>{item.needsRecheck&&<p className="owner-recheck">🔄 Fiches modifiées : à revérifier</p>}<button type="button" onClick={()=>onOpen(item.key)}>✏️ Remplir / contrôler</button>
  </article>)}</div>
  {warning&&<p className="owner-review-warning" role="alert">⚠ {warning}</p>}
  <p className="owner-setup-warning">✅ Coche « Vérifié » seulement après avoir contrôlé chaque rubrique. Le ZIP complet conserve tes fiches, réglages, cases de vérification et photos originales. Pour récupérer les données sur un autre appareil, extrais le JSON du ZIP puis utilise « Vérifier une sauvegarde JSON » ; les photos restent à réimporter manuellement. Aucun envoi dans le cloud et aucun partage sans ta décision.</p>
 </section>;
}
