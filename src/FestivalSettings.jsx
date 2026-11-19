import React,{useEffect,useState} from 'react';
import {driveBalanceLinks,eventEditionYear,eventYearBalance,groupFestivalEditions,yearChoices} from './lib/eventEditions.js';

const euro=cents=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(cents/100);
const safeDrive=url=>/^https:\/\/(?:drive|docs)\.google\.com\//.test(url||'');

function EventEditor({event,onSave,readOnly}){
 const [fields,setFields]=useState([...event.values]);
 const [message,setMessage]=useState('');
 useEffect(()=>{setFields([...event.values]);setMessage('');},[event.id]);
 const dirty=fields.some((value,index)=>value!==event.values[index]);
 return <form className="festapp-festival-edit" onSubmit={e=>{e.preventDefault();try{onSave(event.id,fields);setMessage('✅ Modifications enregistrées sur cet appareil.');}catch(error){setMessage('⚠ '+error.message);}}}>
  <label>Nom de la manifestation<input value={fields[0]} onChange={e=>setFields(old=>[e.target.value,old[1],old[2]])} maxLength={200} required/></label>
  <label>Date et horaires<input value={fields[1]} onChange={e=>setFields(old=>[old[0],e.target.value,old[2]])} maxLength={200} placeholder="Ex. 05/12/2026 · 14h–22h"/></label>
  <label>Lieu<input value={fields[2]} onChange={e=>setFields(old=>[old[0],old[1],e.target.value])} maxLength={200} placeholder="Ex. Liernais"/></label>
  <button type="submit" disabled={readOnly||!dirty}>Enregistrer les modifications</button>
  {message&&<p role="status" className="festapp-festival-status">{message}</p>}
  <small>Le lien avec les tâches, bénévoles et finances existants est conservé.</small>
 </form>;
}

export default function FestivalSettings({events=[],finance=[],archives=[],driveCatalog,readOnly=false,onUpdate,onCreateEdition,onOpenFinance,onOpenDrive}){
 const groups=groupFestivalEditions(events);
 const [selectedId,setSelectedId]=useState('');
 const chosen=events.find(event=>event.id===selectedId)||events[0];
 const [newBase,setNewBase]=useState('');
 const [newYear,setNewYear]=useState(String(new Date().getFullYear()));
 const [createStatus,setCreateStatus]=useState('');
 const [selectedYears,setSelectedYears]=useState({});
 const [balanceStatus,setBalanceStatus]=useState(null);
 const years=yearChoices(events);
 const create=(base,year)=>{
  const row=onCreateEdition(base,year);
  setSelectedId(row.id);
  setCreateStatus(`✅ Édition ${row.values[0]} créée. Ajoute maintenant sa date et ses écritures.`);
  return row;
 };
 return <div className="festapp-festival-settings">
  <details className="festapp-settings-menu" aria-label="Gérer les manifestations et leurs dates">
   <summary><span aria-hidden="true">🎉</span><span><strong>Gérer les manifestations</strong><small>Noms, dates, horaires et éditions</small></span></summary>
   <div className="festapp-settings-menu-content">
    <label>Choisir la fête à modifier<select value={chosen?.id||''} onChange={e=>setSelectedId(e.target.value)}>{groups.map(group=><optgroup label={group.name} key={group.name}>{group.events.map(event=><option key={event.id} value={event.id}>{event.values[0]}{event.values[1]?' · '+event.values[1]:''}</option>)}</optgroup>)}</select></label>
    {chosen&&<EventEditor key={chosen.id} event={chosen} onSave={onUpdate} readOnly={readOnly}/>}
    <details className="festapp-festival-add"><summary>＋ Ajouter une édition (2022, 2024, 2027…)</summary>
     <div className="festapp-festival-add-fields"><label>Manifestation<select value={newBase||groups[0]?.name||''} onChange={e=>setNewBase(e.target.value)}>{groups.map(group=><option value={group.name} key={group.name}>{group.name}</option>)}</select></label><label>Année<input type="number" min="1900" max="2099" value={newYear} onChange={e=>setNewYear(e.target.value)}/></label>
      <button type="button" disabled={readOnly||!groups.length} onClick={()=>{try{create(newBase||groups[0]?.name,newYear);}catch(error){setCreateStatus('⚠ '+error.message);}}}>Créer cette édition</button></div>
     <p>Une nouvelle fiche est créée sans écraser les années précédentes ni recopier leurs comptes.</p>
    </details>
    {createStatus&&<p role="status" className="festapp-festival-status">{createStatus}</p>}
   </div>
  </details>
  <details className="festapp-settings-menu" aria-label="Bilans des manifestations par année">
   <summary><span aria-hidden="true">📊</span><span><strong>Bilans par fête et par année</strong><small>2026, 2025, 2024, 2022, 2021…</small></span></summary>
   <div className="festapp-settings-menu-content">
    <p>Ouvre une fête, puis choisis l’année. Chaque édition conserve son propre bilan : les montants d’autres fêtes ne sont jamais mélangés.</p>
    {groups.map(group=>{
     const knownYears=group.events.map(eventEditionYear).filter(Number.isInteger);
     const selected=selectedYears[group.name]||Math.max(...(knownYears.length?knownYears:[new Date().getFullYear()]));
     const balance=eventYearBalance(events,finance,group.name,selected);
     const drive=driveBalanceLinks(driveCatalog,group.name,selected);
     const documents=(archives||[]).filter(row=>balance.editions.some(event=>event.id===row.eventId)&&/bilan|financ|compte/i.test(row.values?.[0]||''));
     const unyearned=group.events.filter(event=>eventEditionYear(event)===null);
     return <details className="festapp-festival-balance" key={group.name}>
      <summary><strong>{group.name}</strong><span>{knownYears.length?`${[...new Set(knownYears)].sort((a,b)=>b-a).join(' · ')}`:'Années à renseigner'}</span></summary>
      <div className="festapp-festival-balance-body"><label>Année<select value={selected} onChange={e=>{setSelectedYears(old=>({...old,[group.name]:Number(e.target.value)}));setBalanceStatus(null);}}>{years.map(year=><option key={year} value={year}>{year}</option>)}</select></label>
       {balance.editions.length>0?<>
        <div className="festapp-balance-figures"><div><small>Recettes</small><strong>{euro(balance.revenueCents)}</strong></div><div><small>Dépenses</small><strong>{euro(balance.expenseCents)}</strong></div><div><small>Solde calculé</small><strong>{euro(balance.balanceCents)}</strong></div></div>
        <p className="festapp-balance-caption">{balance.rows.length} écriture(s) rattachée(s) à l’édition {selected}.{balance.unclassified>0?` ${balance.unclassified} écriture(s) non classée(s), exclue(s) du calcul.`:''}</p>
        {balance.rows.length===0&&<p>Aucune écriture saisie pour cette année. Les montants affichés ne constituent pas encore un bilan complet.</p>}
        {balance.rows.length>0&&<details className="festapp-balance-records"><summary>Voir les écritures ({balance.rows.length})</summary><ul>{balance.rows.map(row=><li key={row.id}><span>{row.values[0]}</span><strong>{row.values[1]} €</strong><small>{row.values[2]||'Nature à préciser'}</small></li>)}</ul></details>}
        <button type="button" className="festapp-balance-action" onClick={()=>onOpenFinance(balance.editions[0].id)}>Voir / compléter les finances {selected}</button>
       </>:<><p>Aucun bilan rattaché à {group.name} {selected} pour le moment.</p><button type="button" className="festapp-balance-action" disabled={readOnly} onClick={()=>{try{const created=create(group.name,String(selected));onOpenFinance(created.id);}catch(error){setBalanceStatus({base:group.name,year:selected,message:'⚠ '+error.message});}}}>Créer l’édition {selected} et saisir son bilan</button></>}
       {unyearned.length>0&&<p className="festapp-balance-caption">{unyearned.length} fiche(s) sans année : renseigne leur date dans « Gérer les manifestations » pour les classer.</p>}
       {(documents.length>0||drive.length>0)&&<div className="festapp-balance-documents"><strong>Documents disponibles</strong>{documents.map(row=>safeDrive(row.values[2])?<a href={row.values[2]} target="_blank" rel="noopener noreferrer" key={row.id}>📄 {row.values[0]}</a>:<p key={row.id}>{row.values[0]} · {row.values[1]}</p>)}{drive.map(file=><a key={file.id} href={file.url} target="_blank" rel="noopener noreferrer">📁 {file.title}</a>)}</div>}
       {balanceStatus?.base===group.name&&balanceStatus.year===selected&&<p role="status" className="festapp-festival-status">{balanceStatus.message}</p>}
      </div>
     </details>;
    })}
    <button type="button" className="festapp-balance-drive" onClick={onOpenDrive}>Chercher les anciens bilans dans le Drive</button>
    <p className="festapp-balance-caption">Les anciens fichiers du Drive ne sont pas comptabilisés automatiquement : il faut les rattacher à la bonne édition après vérification. Les bilans affichés ici utilisent uniquement les écritures enregistrées sur cet appareil.</p>
   </div>
  </details>
 </div>;
}
