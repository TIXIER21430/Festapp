import React,{useState} from 'react';
import {makeRentalPdf,rentalPdfName} from './lib/rentalPdf.js';
import {rentalEquipment} from './lib/rentalCatalog.js';
import {availableForPeriod,checkLoanAvailability,currentEquipment,loanDocument,loanRecord,loanTotals,localDay,readLoan} from './lib/equipmentLoans.js';

const euro=cents=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(cents/100);
const labels={draft:'Devis à valider',reserved:'Réservé',out:'Sorti',returned:'Rendu',cancelled:'Annulé'};
const blankLine=()=>({equipmentId:'',quantity:'1',price:''});
const blankCustomer=()=>({name:'',address:'',phone:'',email:''});
const money=s=>{
 if(!/^\d+(?:[.,]\d{1,2})?$/.test(String(s).trim()))throw new Error('Montant invalide.');
 return Math.round(Number(String(s).replace(',','.'))*100);
};
function downloadDocument(loan){
 const url=URL.createObjectURL(makeRentalPdf(loan));
 const a=document.createElement('a');a.href=url;a.download=rentalPdfName(loan);a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function EquipmentLoans({data,onSave,readOnly=false}){
 const equipment=rentalEquipment(data.equipment||[],data.equipmentRentalLinks||[]),rows=data.equipmentLoans||[],today=localDay();
 const [mode,setMode]=useState('');
 const [customer,setCustomer]=useState(blankCustomer);
 const [contactId,setContactId]=useState('');
 const [start,setStart]=useState(today);
 const [end,setEnd]=useState(today);
 const [lines,setLines]=useState([blankLine()]);
 const [startTime,setStartTime]=useState('');
 const [endTime,setEndTime]=useState('');
 const [notes,setNotes]=useState('');
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [history,setHistory]=useState(false);
 const [filter,setFilter]=useState('');
 const [expanded,setExpanded]=useState('');
 let loans,balances;
 try{loans=rows.map(readLoan);balances=equipment.map(e=>({...currentEquipment(e,rows,today),id:e.id,name:e.values[0],inventoryId:e.inventoryId,linked:e.linked,catalogKey:e.id.slice(8)}));}
 catch(e){return <p role="alert">Impossible de lire les mouvements de matériel. Les données existantes sont conservées.</p>;}
 const live=loans.filter(l=>['reserved','out','draft'].includes(l.status));
 const count=balances.reduce((a,b)=>({available:a.available+Math.max(0,b.available??0),out:a.out+b.out,unknown:a.unknown+(b.total===null?1:0)}),{available:0,out:0,unknown:0});
 const reservedCount=loans.filter(l=>l.status==='reserved').reduce((n,l)=>n+l.items.reduce((sum,i)=>sum+i.quantity,0),0);
 const kind=mode==='rental'?'rental':'loan';
 const selectedLines=lines.map(line=>({line,record:equipment.find(r=>r.id===line.equipmentId)}));
 function linkInventory(catalogKey,inventoryId){
  if(readOnly)return;
  try{
   const links=data.equipmentRentalLinks||[];
   if(inventoryId&&links.some(l=>l.id!==catalogKey&&l.values[1]===inventoryId))throw new Error('Cette fiche est déjà liée à une autre référence.');
   const next=links.filter(l=>l.id!==catalogKey);
   if(inventoryId)next.push({id:catalogKey,values:[catalogKey,inventoryId,'']});
   onSave({...data,equipmentRentalLinks:next});
   setError('');setMessage('Lien avec l’inventaire enregistré.');
  }catch(e){setError(e.message);}
 }
 function begin(next){
  setMode(next);setCustomer(blankCustomer());setContactId('');setStart(today);setEnd(today);setLines([blankLine()]);setStartTime('');setEndTime('');setNotes('');setError('');setMessage('');
 }
 function pickContact(id){
  setContactId(id);const c=(data.contacts||[]).find(c=>c.id===id);
  if(c)setCustomer({name:c.values[0]||'',address:'',phone:c.phone||'',email:c.email||''});
 }
 function updateLine(index,key,value){setLines(old=>old.map((line,i)=>i===index?{...line,[key]:value}:line));}
 function value(){
  return {version:1,kind,start:mode==='immediate'?today:start,end,created:today,customer:Object.fromEntries(Object.entries(customer).map(([k,v])=>[k,v.trim()])),rateMode:'flat',startTime,endTime,
  depositCents:kind==='rental'?selectedLines.reduce((n,{line,record})=>n+Number(line.quantity)*(record?.depositCents??0),0):0,notes:notes.trim(),
  items:selectedLines.map(({line,record})=>({equipmentId:line.equipmentId,name:record?.values[0]||'',quantity:Number(line.quantity),priceCents:kind==='loan'?0:record?.priceCents,depositRateCents:record?.depositCents}))};
 }
 let estimate=null;
 try{const x=value();if(x.start<=x.end&&x.items.every(i=>Number.isInteger(i.quantity)&&i.quantity>0))estimate=loanTotals(x);}catch{}
 function submit(e,status){
  e.preventDefault();setError('');setMessage('');
  if(readOnly)return;
  try{
   const x=value();
   if(x.start<today)throw new Error('La date de sortie ne peut pas être antérieure à aujourd’hui.');
   if(kind==='rental'&&(!startTime||!endTime||(x.start===x.end&&startTime>=endTime)))throw new Error('Vérifie les heures de location.');
   const row=loanRecord(crypto.randomUUID(),status,x);
   checkLoanAvailability(x,equipment,rows,today);
   onSave({...data,equipmentLoans:[...rows,row]});
   setMode('');setExpanded(row.id);setMessage(status==='draft'?'Devis enregistré, matériel non réservé.':status==='out'?'Sortie enregistrée.':'Réservation enregistrée.');
  }catch(err){setError(err.message||'Enregistrement impossible.');}
 }
 function changeStatus(loan,status){
  if(readOnly)return;
  if(!window.confirm(status==='returned'?'Confirmer le retour intégral du matériel ?':status==='cancelled'?'Annuler ce dossier ?':status==='out'?'Confirmer la remise effective du matériel ?':'Confirmer la réservation ?'))return;
  setError('');setMessage('');
  try{
   const {id,status:old,...x}=loan;
   if(status==='out'){
    if(today>x.end)throw new Error('Date de retour dépassée : créer un dossier avec des dates valides.');
    x.start=today;checkLoanAvailability(x,equipment,rows,today,id);
   }
   if(status==='reserved'){if(x.start<today)throw new Error('La date de sortie est dépassée.');checkLoanAvailability(x,equipment,rows,today,id);}
   onSave({...data,equipmentLoans:rows.map(r=>r.id===id?loanRecord(id,status,x):r)});
   setMessage(labels[status]+' : '+loan.customer.name);
  }catch(err){setError(err.message||'Enregistrement impossible.');}
 }
 async function emailDraft(loan){
  if(!loan.customer.email){setError('Renseigne une adresse e-mail.');return;}
  const subject=(loan.kind==='rental'?'Contrat de location':'Bon de prêt')+' — Comité des fêtes de Liernais';
  const body='Bonjour '+loan.customer.name+',\n\nMerci de nous retourner le contrat ci-joint signé, accompagné de votre attestation d’assurance pour une location.\n\nLe Comité des fêtes de Liernais';
  const file=new File([makeRentalPdf(loan)],rentalPdfName(loan),{type:'application/pdf'});
  if(navigator.canShare?.({files:[file]})){
   try{await navigator.share({files:[file],title:subject,text:body+'\nDestinataire : '+loan.customer.email});setMessage('Partage ouvert : sélectionne ta messagerie et vérifie le destinataire.');return;}catch(e){if(e.name==='AbortError')return;}
  }
  downloadDocument(loan);
  setMessage('PDF téléchargé. Joins-le au mail qui s’ouvre avant de l’envoyer.');
  window.location.href='mailto:'+encodeURIComponent(loan.customer.email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
 }
 return <section className="festapp-loan-panel" aria-label="Prêts et locations de matériel">
  <div className="festapp-loan-summary"><div><strong>{count.available}</strong><small>Disponibles aujourd’hui</small></div><div><strong>{count.out}</strong><small>Sortis</small></div><div><strong>{reservedCount}</strong><small>Réservés (toutes dates)</small></div></div>
  {count.unknown>0&&<p className="note">Quantité à vérifier sur {count.unknown} fiche(s) : elles ne sont pas comptées dans le disponible.</p>}
  <p className="note">Inventaire commun du comité, toutes manifestations confondues. Un devis seul ne bloque pas le stock. Les réservations tiennent compte des dates, et une sortie en retard reste indisponible jusqu’au retour enregistré.</p>
  <div className="festapp-loan-inventory"><h3>Disponibilités aujourd’hui</h3><label>Rechercher<input type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Tables, barnums…"/></label>
   {balances.filter(b=>b.name.toLocaleLowerCase('fr').includes(filter.toLocaleLowerCase('fr'))).map(b=><div className="festapp-loan-balance" key={b.id}><strong>{b.name}</strong><span>{b.total===null?'À vérifier':b.available+' / '+b.total+' disponibles'}</span><small>{b.out} sorti(s) · {b.reserved} réservé(s) aujourd’hui</small><details open={!b.linked?true:undefined}><summary>{b.linked?'Fiche inventaire liée':'Associer une fiche de l’inventaire'}</summary><label>Fiche de référence<select disabled={readOnly} value={b.inventoryId} onChange={e=>linkInventory(b.catalogKey,e.target.value)}><option value="">Association automatique</option>{(data.equipment||[]).map(r=><option key={r.id} value={r.id}>{r.values[0]} — {r.values[1]||'quantité inconnue'}</option>)}</select></label><small>La quantité est toujours lue dans cette fiche, sans deuxième saisie.</small></details></div>)}
  </div>
  <label className="festapp-loan-new">＋ Nouveau prêt / location<select disabled={readOnly} value={mode} onChange={e=>{if(mode&&!window.confirm('Abandonner la saisie en cours ?'))return;begin(e.target.value);}}><option value="">Choisir une action</option><option value="immediate">Prêt immédiat</option><option value="reservation">Réserver un prêt gratuit</option><option value="rental">Créer un devis de location</option></select></label>
  {mode&&<form className="festapp-loan-form" onSubmit={e=>submit(e,mode==='immediate'?'out':mode==='reservation'?'reserved':'draft')}>
   <h3>{mode==='immediate'?'Prêt immédiat':mode==='reservation'?'Réservation gratuite':'Devis de location'}</h3>
   <label>Contact dans l’annuaire<select value={contactId} onChange={e=>pickContact(e.target.value)}><option value="">Saisie manuelle</option>{(data.contacts||[]).map(c=><option value={c.id} key={c.id}>{c.values[0]}</option>)}</select></label>
   <div className="fields">{[['name','Nom et prénom','text'],['address','Adresse complète','text'],['phone','Téléphone','tel'],['email','E-mail','email']].map(([k,label,type])=><label key={k}>{label}<input type={type} required={k==='name'||k==='phone'||kind==='rental'} value={customer[k]} onChange={e=>setCustomer(c=>({...c,[k]:e.target.value}))}/></label>)}</div>
   <div className="fields"><label>Date de sortie<input type="date" min={today} required disabled={mode==='immediate'} value={mode==='immediate'?today:start} onChange={e=>setStart(e.target.value)}/></label><label>Retour prévu<input type="date" required min={mode==='immediate'?today:start} value={end} onChange={e=>setEnd(e.target.value)}/></label></div>
   <div className="fields"><label>Heure de sortie<input type="time" required={kind==='rental'} value={startTime} onChange={e=>setStartTime(e.target.value)}/></label><label>Heure de retour<input type="time" required={kind==='rental'} value={endTime} onChange={e=>setEndTime(e.target.value)}/></label></div>
   {selectedLines.map(({line,record},i)=>{
    const avail=record?availableForPeriod(record,rows,mode==='immediate'?today:start,end,today):null;
    const exceeded=avail!==null&&Number(line.quantity)>avail;
    return <div className="festapp-loan-line" key={i}><label>Matériel<select value={line.equipmentId} required onChange={e=>updateLine(i,'equipmentId',e.target.value)}><option value="">Sélectionner</option>{equipment.filter(r=>r.id===line.equipmentId||!lines.some((l,j)=>i!==j&&l.equipmentId===r.id)).map(r=><option value={r.id} key={r.id}>{r.values[0]}</option>)}</select></label><label>Quantité<input type="number" required min="1" max="100000" step="1" value={line.quantity} onChange={e=>updateLine(i,'quantity',e.target.value)}/></label>{kind==='rental'&&record&&<p>Tarif : {euro(record.priceCents)} / unité · Caution unitaire : {euro(record.depositCents)} · Caution ligne : {euro(record.depositCents*(Number(line.quantity)||0))}</p>}{record&&<small role={exceeded?'alert':'status'}>{avail===null?'Quantité ou dates à vérifier':Math.max(0,avail)+' disponible(s) sur la période'}{exceeded?' — quantité insuffisante':''}</small>}{lines.length>1&&<button type="button" className="secondary" onClick={()=>setLines(old=>old.filter((_,j)=>j!==i))}>Retirer la ligne</button>}</div>;
   })}
   <button type="button" className="secondary" disabled={lines.length>=equipment.length} onClick={()=>setLines(old=>[...old,blankLine()])}>＋ Ajouter un matériel</button>
   {kind==='rental'&&<p className="note">Caution calculée automatiquement : quantité × caution unitaire pour chaque matériel.</p>}
   <label>Conditions / observations<textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Transport, restitution, conditions convenues…"/></label>
   {estimate&&<p className="festapp-loan-total"><strong>Total : {euro(estimate.totalCents)}</strong> · Caution : {euro(estimate.depositCents)} · {estimate.days} jour(s)</p>}
   <button type="submit" disabled={readOnly}>{mode==='immediate'?'Enregistrer la sortie':mode==='reservation'?'Réserver le matériel':'Enregistrer le devis'}</button>
   <button type="button" className="secondary" onClick={()=>{if(window.confirm('Abandonner la saisie ?'))begin('');}}>Annuler</button>
  </form>}
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  <div className="festapp-loan-list"><h3>Dossiers en cours</h3>{!live.length&&<p>Aucun prêt, location ou devis en cours.</p>}
   {(history?loans:live).slice().reverse().map(l=><article key={l.id} className="festapp-loan-record"><button className="festapp-loan-record-heading" type="button" aria-expanded={expanded===l.id} onClick={()=>setExpanded(expanded===l.id?'':l.id)}><strong>{l.customer.name}</strong><span>{labels[l.status]}</span><small>{l.start} → {l.end} · {l.items.map(i=>i.quantity+' × '+i.name).join(', ')}</small>{l.status==='out'&&l.end<today&&<small>Retour en retard</small>}</button>
   {expanded===l.id&&<div><p>{l.customer.address} · {l.customer.phone} · {l.customer.email}</p><p><strong>{euro(loanTotals(l).totalCents)}</strong> · Caution {euro(l.depositCents)}</p>
    <div className="festapp-loan-actions"><button type="button" className="secondary" onClick={()=>downloadDocument(l)}>Télécharger le PDF</button><button type="button" className="secondary" disabled={!l.customer.email} onClick={()=>emailDraft(l)}>Partager le PDF pour signature</button>{l.status==='draft'&&<button type="button" disabled={readOnly} onClick={()=>changeStatus(l,'reserved')}>Confirmer la réservation</button>}{l.status==='reserved'&&<button type="button" disabled={readOnly} onClick={()=>changeStatus(l,'out')}>Matériel remis</button>}{l.status==='out'&&<button type="button" disabled={readOnly} onClick={()=>changeStatus(l,'returned')}>Matériel rendu</button>}{['draft','reserved'].includes(l.status)&&<button type="button" className="secondary" disabled={readOnly} onClick={()=>changeStatus(l,'cancelled')}>Annuler le dossier</button>}</div>
    <p className="note">Sur téléphone, partage le PDF avec ta messagerie. Sur ordinateur, joins le PDF téléchargé au brouillon. L’envoi automatique et la signature électronique ne sont pas connectés.</p>
   </div>}</article>)}
   <button type="button" className="secondary" onClick={()=>setHistory(v=>!v)}>{history?'Masquer l’historique':'Voir aussi les dossiers terminés'}</button>
  </div>
 </section>;
}
