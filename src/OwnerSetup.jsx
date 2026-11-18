import React,{useState} from 'react';
import {OWNER_REVIEW_KEY,parseOwnerReviews,summarizeOwnerReviews} from './lib/ownerSetup.js';

export default function OwnerSetup({data,onOpen,readOnly=false}){
 const [reviews,setReviews]=useState(()=>{try{return parseOwnerReviews(localStorage.getItem(OWNER_REVIEW_KEY));}catch{return {};}});
 const [warning,setWarning]=useState('');
 const {items,checked,total}=summarizeOwnerReviews(data,reviews);
 function toggle(key){
  if(readOnly)return;
  const next={...reviews};
  if(next[key])delete next[key];else next[key]={checked:true,at:new Date().toISOString()};
  try{localStorage.setItem(OWNER_REVIEW_KEY,JSON.stringify(next));setReviews(next);setWarning('');}
  catch{setWarning('Impossible de mémoriser les vérifications sur cet appareil. Exportez vos données avant de le quitter.');}
 }
 return <section className="owner-setup" aria-label="Préparer FEST’APP avant de la partager">
  <div className="owner-setup-heading"><div><span className="owner-setup-pill">🔒 Préparation privée</span><h2>Je remplis et je vérifie mon appli</h2><p>Avance rubrique par rubrique. <strong>Rien n’est partagé aux membres du bureau.</strong></p></div><div className="owner-progress" role="status"><strong>{checked} / {total}</strong><span>rubriques vérifiées</span></div></div>
  <progress value={checked} max={total} aria-label="Progression de la vérification de FEST’APP"/>
  <div className="owner-setup-grid">{items.map(item=><article className="owner-setup-item" key={item.key}>
    <div className="owner-setup-item-top"><span aria-hidden="true">{item.icon}</span><div><strong>{item.label}</strong><small>{item.count} fiche(s)</small></div><label className="owner-review-check"><input type="checkbox" checked={item.checked} disabled={readOnly} onChange={()=>toggle(item.key)} aria-label={'J’ai vérifié : '+item.label}/> Vérifié</label></div>
    <p>{item.hint}</p><button type="button" onClick={()=>onOpen(item.key)}>✏️ Remplir / contrôler</button>
  </article>)}</div>
  {warning&&<p className="owner-review-warning" role="alert">⚠ {warning}</p>}
  <p className="owner-setup-warning">✅ Coche « Vérifié » seulement après avoir contrôlé chaque rubrique. Les cases sont conservées localement, séparément des fiches. Avant tout partage : télécharge la sauvegarde JSON et conserve les photos originales à part. L’accès des autres membres restera fermé jusqu’à ta décision.</p>
 </section>;
}
