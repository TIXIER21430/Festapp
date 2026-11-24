import React,{useState} from 'react';
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
 const url=URL.createObjectURL(new Blob([loanDocument(loan)],{type:'text/plain;charset=utf-8'}));
 const a=document.createElement('a');a.href=url;a.download='FESTAPP-'+(loan.kind==='rental'?'devis':'pret')+'-'+loan.id+'.txt';a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export default function EquipmentLoans({data,onSave,readOnly=false}){
 const equipment=data.equipment||[],rows=data.equipmentLoans||[],today=localDay();
 const [mode,setMode]=useState('');
 const [customer,setCustomer]=useState(blankCustomer);
 const [contactId,setContactId]=useState('');
 const [start,setStart]=useState(today);
 const [end,setEnd]=useState(today);
 const [lines,setLines]=useState([blankLine()]);
 const [rateMode,setRateMode]=useState('flat');
 const [deposit,setDeposit]=useState('0');
 const [notes,setNotes]=useState('');
 const [error,setError]=useState('');
 const [message,setMessage]=useState('');
 const [history,setHistory]=useState(false);
 const [filter,setFilter]=useState('');
 const [expanded,setExpanded]=useState('');
 let loans,balances;
 try{loans=rows.map(readLoan);balances=equipment.map(e=>({...currentEquipment(e,rows,today),id:e.id,name:e.values[0]}));}
 catch(e){return <p role="alert">Impossible de lire les mouvements de matériel. Les données existantes sont conservées.</p>;}
 const live=loans.filter(l=>['reserved','out','draft'].includes(l.status));
 const count=balances.reduce((a,b)=>({available:a.available+Math.max(0,b.available??0),out:a.out+b.out,unknown:a.unknown+(b.total===null?1:0)}),{available:0,out:0,unknown:0});
 const reservedCount=loans.filter(l=>l.status==='reserved').reduce((n,l)=>n+l.items.reduce((sum,i)=>sum+i.quantity,0),0);
 const kind=mode==='rental'?'rental':'loan';
 const selectedLines=lines.map(line=>({line,record:equipment.find(r=>r.id===line.equipmentId)}));
 function begin(next){
  setMode(next);setCustomer(blankCustomer());setContactId('');setStart(today);setEnd(today);setLines([blankLine()]);setRateMode('flat');setDeposit('0');setNotes('');setError('');setMessage('');
 }
 function pickContact(id){
  setContactId(id);const c=(data.contacts||[]).find(c=>c.id===id);
  if(c)setCustomer({name:c.values[0]||'',address:'',phone:c.phone||'',email:c.email||''});
 }
 function updateLine(index,key,value){setLines(old=>old.map((line,i)=>i===index?{...line,[key]:value}:line));}
 function value(){
  return {version:1,kind,start:mode==='immediate'?today:start,end,created:today,customer:Object.fromEntries(Object.entries(customer).map(([k,v])=>[k,v.trim()])),rateMode,
  depositCents:money(deposit),notes:notes.trim(),
  items:selectedLines.map(({line,record})=>({equipmentId:line.equipmentId,name:record?.values[0]||'',quantity:Number(line.quantity),priceCents:kind==='loan'?0:money(line.price)}))};
 }
 let estimate=null;
 try{const x=value();if(x.start<=x.end&&x.items.every(i=>Number.isInteger(i.quantity)&&i.quantity>0))estimate=loanTotals(x);}catch{}
 function submit(e,status){
  e.preventDefault();setError('');setMessage('');
  if(readOnly)return;
  try{
   const x=value();
   if(x.start<today)throw new Error('La date de sortie ne peut pas être antérieure à aujourd’hui.');
   const row=loanRecord(crypto.randomUUID(),status,x);
   if(status!=='draft')checkLoanAvailability(x,equipment,rows,today);
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
 function emailDraft(loan){
  if(!loan.customer.email){setError('Renseigne une adresse e-mail.');return;}
  const subject=(loan.kind==='rental'?'Devis de location':'Bon de prêt')+' — Comité des fêtes de Liernais';
  const body='Bonjour '+loan.customer.name+',\n\nVoici notre proposition. Merci de nous retourner votre accord signé avant la remise du matériel.\n\n'+loanDocument(loan);
  window.location.href='mailto:'+encodeURIComponent(loan.customer.email)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);
 }
 return <section className="festapp-loan-panel" aria-label="Prêts et locations de matériel">
  <div className="festapp-loan-summary"><div><strong>{count.available}</strong><small>Disponibles aujourd’hui</small></div><div><strong>{count.out}</strong><small>Sortis</small></div><div><strong>{reservedCount}</strong><small>Réservés (toutes dates)</small></div></div>
  {count.unknown>0&&<p className="note">Quantité à vérifier sur {count.unknown} fiche(s) : elles ne sont pas comptées dans le disponible.</p>}
  <p className="note">Inventaire commun du comité, toutes manifestations confondues. Un devis seul ne bloque pas le stock. Les réservations tiennent compte des dates, et une sortie en retard reste indisponible jusqu’au retour enregistré.</p>
  <div className="festapp-loan-inventory"><h3>Disponibilités aujourd’hui</h3><label>Rechercher<input type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Tables, barnums…"/></label>
   {balances.filter(b=>b.name.toLocaleLowerCase('fr').includes(filter.toLocaleLowerCase('fr'))).map(b=><div className="festapp-loan-balance" key={b.id}><strong>{b.name}</strong><span>{b.total===null?'À vérifier':b.available+' / '+b.total+' disponibles'}</span><small>{b.out} sorti(s) · {b.reserved} réservé(s) aujourd’hui</small></div>)}
  </div>
  <label className="festapp-loan-new">＋ Nouveau prêt / location<select disabled={readOnly} value={mode} onChange={e=>{if(mode&&!window.confirm('Abandonner la saisie en cours ?'))return;begin(e.target.value);}}><option value="">Choisir une action</option><option value="immediate">Prêt immédiat</option><option value="reservation">Réserver un prêt gratuit</option><option value="rental">Créer un devis de location</option></select></label>
  {mode&&<form className="festapp-loan-form" onSubmit={e=>submit(e,mode==='immediate'?'out':mode==='reservation'?'reserved':'draft')}>
   <h3>{mode==='immediate'?'Prêt immédiat':mode==='reservation'?'Réservation gratuite':'Devis de location'}</h3>
   <label>Contact dans l’annuaire<select value={contactId} onChange={e=>pickContact(e.target.value)}><option value="">Saisie manuelle</option>{(data.contacts||[]).map(c=><option value={c.id} key={c.id}>{c.values[0]}</option>)}</select></label>
   <div className="fields">{[['name','Nom et prénom','text'],['address','Adresse complète','text'],['phone','Téléphone','tel'],['email','E-mail','email']].map(([k,label,type])=><label key={k}>{label}<input type={type} required={k==='name'||k==='phone'||kind==='rental'} value={customer[k]} onChange={e=>setCustomer(c=>({...c,[k]:e.target.value}))}/></label>)}</div>
   <div className="fields"><label>Date de sortie<input type="date" min={today} required disabled={mode==='immediate'} value={mode==='immediate'?today:start} onChange={e=>setStart(e.target.value)}/></label><label>Retour prévu<input type="date" required min={mode==='immediate'?today:start} value={end} onChange={e=>setEnd(e.target.value)}/></label></div>
   {kind==='rental'&&<label>Tarification<select value={rateMode} onChange={e=>setRateMode(e.target.value)}><option value="flat">Par unité pour toute la durée</option><option value="day">Par unité et par jour</option></select></label>}
   {selectedLines.map(({line,record},i)=>{
    const avail=record?availableForPeriod(record,rows,mode==='immediate'?today:start,end,today):null;
    const exceeded=avail!==null&&Number(line.quantity)>avail;
    return <div className="festapp-loan-line" key={i}><label>Matériel<select value={line.equipmentId} required onChange={e=>updateLine(i,'equipmentId',e.target.value)}><option value="">Sélectionner</option>{equipment.filter(r=>r.id===line.equipmentId||!lines.some((l,j)=>i!==j&&l.equipmentId===r.id)).map(r=><option value={r.id} key={r.id}>{r.values[0]}</option>)}</select></label><label>Quantité<input type="number" required min="1" max="100000" step="1" value={line.quantity} onChange={e=>updateLine(i,'quantity',e.target.value)}/></label>{kind==='rental'&&<label>Prix unitaire (€)<input required inputMode="decimal" placeholder="0,00" value={line.price} onChange={e=>updateLine(i,'price',e.target.value)}/></label>}{record&&<small role={exceeded?'alert':'status'}>{avail===null?'Quantité ou dates à vérifier':Math.max(0,avail)+' disponible(s) sur la période'}{exceeded?' — quantité insuffisante':''}</small>}{lines.length>1&&<button type="button" className="secondary" onClick={()=>setLines(old=>old.filter((_,j)=>j!==i))}>Retirer la ligne</button>}</div>;
   })}
   <button type="button" className="secondary" disabled={lines.length>=equipment.length} onClick={()=>setLines(old=>[...old,blankLine()])}>＋ Ajouter un matériel</button>
   <label>Caution (€)<input inputMode="decimal" value={deposit} onChange={e=>setDeposit(e.target.value)}/></label>
   <label>Conditions / observations<textarea rows={3} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Transport, restitution, conditions convenues…"/></label>
   {estimate&&<p className="festapp-loan-total"><strong>Total : {euro(estimate.totalCents)}</strong> · Caution : {euro(estimate.depositCents)} · {estimate.days} jour(s)</p>}
   <button type="submit" disabled={readOnly}>{mode==='immediate'?'Enregistrer la sortie':mode==='reservation'?'Réserver le matériel':'Enregistrer le devis'}</button>
   <button type="button" className="secondary" onClick={()=>{if(window.confirm('Abandonner la saisie ?'))begin('');}}>Annuler</button>
  </form>}
  {error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
  <div className="festapp-loan-list"><h3>Dossiers en cours</h3>{!live.length&&<p>Aucun prêt, location ou devis en cours.</p>}
   {(history?loans:live).slice().reverse().map(l=><article key={l.id} className="festapp-loan-record"><button className="festapp-loan-record-heading" type="button" aria-expanded={expanded===l.id} onClick={()=>setExpanded(expanded===l.id?'':l.id)}><strong>{l.customer.name}</strong><span>{labels[l.status]}</span><small>{l.start} → {l.end} · {l.items.map(i=>i.quantity+' × '+i.name).join(', ')}</small>{l.status==='out'&&l.end<today&&<small>Retour en retard</small>}</button>
   {expanded===l.id&&<div><p>{l.customer.address} · {l.customer.phone} · {l.customer.email}</p><p><strong>{euro(loanTotals(l).totalCents)}</strong> · Caution {euro(l.depositCents)}</p>
    <div className="festapp-loan-actions"><button type="button" className="secondary" onClick={()=>downloadDocument(l)}>Télécharger le document</button><button type="button" className="secondary" disabled={!l.customer.email} onClick={()=>emailDraft(l)}>Préparer le mail pour signature</button>{l.status==='draft'&&<button type="button" disabled={readOnly} onClick={()=>changeStatus(l,'reserved')}>Confirmer la réservation</button>}{l.status==='reserved'&&<button type="button" disabled={readOnly} onClick={()=>changeStatus(l,'out')}>Matériel remis</button>}{l.status==='out'&&<button type="button" disabled={readOnly} onClick={()=>changeStatus(l,'returned')}>Matériel rendu</button>}{['draft','reserved'].includes(l.status)&&<button type="button" className="secondary" disabled={readOnly} onClick={()=>changeStatus(l,'cancelled')}>Annuler le dossier</button>}</div>
    <p className="note">Le mail est un brouillon à envoyer manuellement. La signature électronique et son suivi ne sont pas connectés.</p>
   </div>}</article>)}
   <button type="button" className="secondary" onClick={()=>setHistory(v=>!v)}>{history?'Masquer l’historique':'Voir aussi les dossiers terminés'}</button>
  </div>
 </section>;
}
