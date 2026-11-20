import React,{useEffect,useMemo,useState} from 'react';
import {listPhotoOriginals} from './lib/photoVault.js';
import ModuleGlyph from './ModuleGlyph.jsx';

const normalize=name=>String(name||'').trim().normalize('NFC').toLocaleLowerCase('fr');

// Photos are linked to contact IDs, never copied into shift records or sent online.
export default function VolunteerPhotoPicker({volunteers=[],assignments=[],selectedName='',readOnly=false,photoRevision=0,onSelect,onAdd}){
 const [portraits,setPortraits]=useState(new Map());
 const [query,setQuery]=useState('');
 const visible=volunteers.filter(person=>normalize(person.name).includes(normalize(query)));
 const counts=useMemo(()=>{
  const result=new Map();
  for(const row of assignments){
   const name=normalize(row?.values?.[0]);
   if(name)result.set(name,(result.get(name)||0)+1);
  }
  return result;
 },[assignments]);
 useEffect(()=>{
  let active=true;const urls=[];
  listPhotoOriginals('contacts').then(rows=>{
   if(!active)return;
   const mapped=new Map();
   for(const row of rows){
    if(!row.recordId||mapped.has(row.recordId))continue;
    const url=URL.createObjectURL(row.blob);
    urls.push(url);mapped.set(row.recordId,url);
   }
   setPortraits(mapped);
  }).catch(()=>{if(active)setPortraits(new Map());});
  return ()=>{active=false;urls.forEach(url=>URL.revokeObjectURL(url));};
 },[photoRevision]);

 return <section className="festapp-volunteer-picker" aria-label="Choisir un bénévole à affecter">
  <div className="festapp-volunteer-picker-heading"><div><h3>Qui vient aider ?</h3><p>Touche une photo pour préparer son affectation à cette fête.</p></div><button type="button" className="festapp-volunteer-add" disabled={readOnly} onClick={onAdd}>＋ Nouveau bénévole</button></div>
  {volunteers.length>8&&<label className="festapp-volunteer-search">Rechercher un bénévole<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Prénom ou nom"/></label>}
  {volunteers.length?<div className="festapp-volunteer-grid">{visible.map(person=>{
   const image=portraits.get(person.id),count=counts.get(normalize(person.name))||0;
   const selected=normalize(person.name)===normalize(selectedName);
   return <button type="button" key={person.id} className={'festapp-volunteer-tile'+(selected?' selected':'')} disabled={readOnly} aria-pressed={selected} aria-label={'Affecter '+person.name} onClick={()=>onSelect(person)}>
    <span className="festapp-volunteer-avatar">{image?<img src={image} alt="" loading="lazy"/>:<ModuleGlyph kind="contacts"/>}</span>
    <strong>{person.name}</strong>
    <small>{count?`${count} affectation${count>1?'s':''}`:'À affecter'}</small>
   </button>;
  })}{!visible.length&&<p className="festapp-volunteer-picker-empty">Aucun bénévole trouvé.</p>}</div>:<p className="festapp-volunteer-picker-empty">Aucun bénévole enregistré. Commence par « Nouveau bénévole » pour créer sa fiche et ajouter sa photo.</p>}
 </section>;
}
