import React,{useRef,useState} from 'react';
import {availableEquipment,readEquipmentLoan} from './lib/equipmentLoans.js';

const today=()=>new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Paris'});

// Demo-only: the parent writes a validated snapshot before confirming a movement.
export default function EquipmentLoans({equipment=[],loans=[],readOnly=false,onIssue,onReturn}){
 const [error,setError]=useState('');
 const [notice,setNotice]=useState('');
 const [busy,setBusy]=useState(false);
 const lastSubmission=useRef(null);
 const rows=loans.map(readEquipmentLoan).sort((a,b)=>b.outDate.localeCompare(a.outDate)||a.id.localeCompare(b.id));
 const open=rows.filter(row=>row.remaining>0);

 async function issue(event){
  event.preventDefault();if(readOnly||busy)return;
  const form=event.currentTarget,f=new FormData(form);
  const payload={equipmentId:String(f.get('equipment')),borrower:String(f.get('borrower')).trim(),
   destination:String(f.get('destination')).trim(),quantity:Number(f.get('quantity')),
   outDate:String(f.get('outDate')),dueDate:String(f.get('dueDate'))||null};
  const signature=JSON.stringify(payload);
  if(signature===lastSubmission.current){setError('Ce prêt vient déjà d’être enregistré. Modifiez les champs pour une autre opération.');return;}
  setBusy(true);setError('');setNotice('');
  try{await onIssue(payload);lastSubmission.current=signature;form.reset();setNotice('Prêt enregistré sur cet appareil, quantité disponible recalculée.');}
  catch(cause){setError(cause.message||'Prêt non enregistré.');}
  finally{setBusy(false);}
 }

 async function giveBack(event,id){
  event.preventDefault();if(readOnly||busy)return;
  const form=event.currentTarget,f=new FormData(form);
  setBusy(true);setError('');setNotice('');
  try{await onReturn(id,{quantity:Number(f.get('quantity')),date:String(f.get('date'))});
   form.reset();setNotice('Retour enregistré. L’historique et le prêt initial restent conservés.');}
  catch(cause){setError(cause.message||'Retour non enregistré.');}
  finally{setBusy(false);}
 }

 return <section className="festapp-loans" aria-label="Prêts de matériel">
  <h3>🤝 Prêts de matériel</h3>
  <p className="note">Qui emprunte quoi, quand et où ? Les prêts et retours partiels sont historisés dans cette démonstration locale et inclus dans la sauvegarde JSON/ZIP. Ils ne sont pas synchronisés entre téléphones.</p>
  {error&&<p role="alert" className="note">⚠ {error}</p>}
  {notice&&<p role="status" className="note">{notice}</p>}
  <form className="festapp-loan-form" onSubmit={issue} onChange={()=>{lastSubmission.current=null;}}>
   <h4>＋ Nouveau prêt</h4>
   <fieldset disabled={readOnly||busy}>
    <label>Quoi ?<select name="equipment" required defaultValue=""><option value="">Choisir un matériel</option>{equipment.map(item=>{
      let info;try{info=availableEquipment(item,loans);}catch{info=null;}
      return <option key={item.id} value={item.id} disabled={!info||!info.available}>{item.values[0]} · {info?info.available+' disponible(s)':'quantité à vérifier'}</option>;
    })}</select></label>
    <label>Combien ?<input name="quantity" type="number" min="1" max="1000000" step="1" required defaultValue="1"/></label>
    <label>Qui ?<input name="borrower" required maxLength="200" placeholder="Nom de la personne ou association"/></label>
    <label>Où ?<input name="destination" required maxLength="200" placeholder="Lieu de destination"/></label>
    <label>Quand ? (départ)<input name="outDate" type="date" defaultValue={today()} required/></label>
    <label>Retour prévu<input name="dueDate" type="date"/></label>
   </fieldset>
   <button type="submit" disabled={readOnly||busy||!equipment.length}>{busy?'Enregistrement…':'Enregistrer le prêt'}</button>
  </form>
  <h4>À récupérer — {open.length} prêt(s)</h4>
  {!open.length&&<p className="note">Aucun matériel actuellement prêté.</p>}
  <div className="festapp-loan-cards">{open.map(row=><article className="festapp-loan-card" key={row.id}>
   <strong>{equipment.find(item=>item.id===row.equipmentId)?.values[0]||'Matériel introuvable'} · {row.remaining} à rendre</strong>
   <p>👤 {row.borrower} · 📍 {row.destination}</p>
   <p>Sorti le {row.outDate} · Retour prévu : {row.dueDate||'non fixé'}</p>
   {row.dueDate&&row.dueDate<today()&&<p className="festapp-loan-overdue">⚠ Retour en retard</p>}
   <form onSubmit={event=>giveBack(event,row.id)} className="festapp-loan-return">
    <label>Quantité rendue<input name="quantity" type="number" min="1" max={row.remaining} step="1" defaultValue={row.remaining} required disabled={readOnly||busy}/></label>
    <label>Date du retour<input name="date" type="date" defaultValue={today()} required disabled={readOnly||busy}/></label>
    <button type="submit" disabled={readOnly||busy}>Confirmer le retour</button>
   </form>
  </article>)}</div>
  <details className="festapp-loan-history"><summary>Historique des prêts et retours ({rows.length})</summary>
   {rows.map(row=><article key={row.id}>
    <strong>{equipment.find(item=>item.id===row.equipmentId)?.values[0]||row.equipmentId}</strong> · {row.borrower}
    <p>{row.quantity} prêté(s) le {row.outDate} vers {row.destination} · {row.remaining===0?'Rendu intégralement':row.remaining+' restant(s)'}</p>
    {row.returns.map(item=><p key={item.id}>↳ {item.quantity} rendu(s) le {item.date}</p>)}
   </article>)}
  </details>
 </section>;
}
