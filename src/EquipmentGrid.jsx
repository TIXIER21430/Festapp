import React,{useEffect,useRef,useState} from 'react';
import {listPhotoOriginals,savePhotoOriginal} from './lib/photoVault.js';
import {availableEquipment} from './lib/equipmentLoans.js';
import ModuleGlyph from './ModuleGlyph.jsx';

// Equipment photos are local originals. They are never fetched from stock-image
// services or synchronised by this grid.
export function equipmentPlaceholder(name){
 const value=String(name||'').toLocaleLowerCase('fr');
 if(/barnum|tente|chapiteau/.test(value))return '⛺';
 if(/table|banc|chaise/.test(value))return '🪑';
 if(/friteuse|crêpière|plancha|grill|réchaud|four|cuisine/.test(value))return '🍳';
 if(/verre|gobelet|écocup|tasse/.test(value))return '🥤';
 if(/sono|enceinte|micro|ampli/.test(value))return '🔊';
 if(/rallonge|câble|éclairage|guirlande/.test(value))return '💡';
 return '🧰';
}

function equipmentGlyphKind(name){
 const marker=equipmentPlaceholder(name);
 return {'⛺':'tent','🪑':'chair','🍳':'food','🥤':'ecocups','🔊':'sound','💡':'light'}[marker]||'equipment';
}

export default function EquipmentGrid({records=[],loans=[],readOnly=false,onEdit,onDelete,photoRevision=0,onPhotoChange}){
 const [thumbnails,setThumbnails]=useState(new Map());
 const [selectedId,setSelectedId]=useState('');
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const closeRef=useRef(null);
 const selected=records.find(item=>item.id===selectedId);
 useEffect(()=>{if(selectedId)closeRef.current?.focus();},[selectedId]);

 useEffect(()=>{
  let active=true;
  const urls=[];
  listPhotoOriginals('equipment').then(photos=>{
   if(!active)return;
   const next=new Map();
   for(const photo of photos){
    if(!photo.recordId||next.has(photo.recordId))continue;
    const url=URL.createObjectURL(photo.blob);
    urls.push(url);
    next.set(photo.recordId,url);
   }
   setThumbnails(next);
  }).catch(()=>{if(active)setThumbnails(new Map());});
  return ()=>{active=false;for(const url of urls)URL.revokeObjectURL(url);};
 },[photoRevision]);

 async function addPhoto(event){
  const file=event.target.files?.[0];
  event.target.value='';
  if(!file||!selected||busy||readOnly)return;
  setBusy(true);setStatus('');
  try{
   await savePhotoOriginal(file,'equipment',selected.id);
   setStatus('✅ Photo ajoutée à ce matériel sur cet appareil.');
   onPhotoChange?.();
  }catch(error){setStatus('⚠ '+(error.message||'Impossible d’ajouter la photo.'));}
  finally{setBusy(false);}
 }

 return <section className="festapp-equipment-catalog" aria-label="Catalogue visuel du matériel">
  {records.length>0&&<div className="festapp-equipment-grid">
   {records.map(item=>{
    const thumbnail=thumbnails.get(item.id);
    let availability;
    try{availability=availableEquipment(item,loans);}catch{availability=null;}
    return <button type="button" key={item.id} className="festapp-equipment-tile" aria-expanded={selectedId===item.id} aria-label={'Ouvrir '+item.values[0]} onClick={()=>{setSelectedId(id=>id===item.id?'':item.id);setStatus('');}}>
     <span className="festapp-equipment-image">{thumbnail?<img src={thumbnail} alt={'Photo de '+item.values[0]} loading="lazy"/>:<span className="festapp-icon-frame" aria-hidden="true"><ModuleGlyph kind={equipmentGlyphKind(item.values[0])}/></span>}</span>
     <strong>{item.values[0]}</strong>
     <small>{availability?`Disponibles : ${availability.available} / ${availability.total}`:'Quantité à vérifier'}</small>
    </button>;
   })}
  </div>}
  {records.length===0&&<p className="festapp-equipment-empty">Aucun matériel trouvé. Appuie sur « + Ajouter » pour créer une fiche.</p>}
  {selected&&<div className="festapp-equipment-backdrop" onClick={()=>setSelectedId('')}>
  <section className="festapp-equipment-detail" role="dialog" aria-modal="true" aria-label={'Fiche matériel : '+selected.values[0]} onClick={event=>event.stopPropagation()} onKeyDown={event=>{if(event.key==='Escape')setSelectedId('');}}>
   <div className="festapp-equipment-detail-heading"><h3>{selected.values[0]}</h3><button ref={closeRef} type="button" className="secondary" onClick={()=>setSelectedId('')} aria-label="Fermer la fiche matériel">✕</button></div>
   {thumbnails.get(selected.id)&&<img className="festapp-equipment-detail-image" src={thumbnails.get(selected.id)} alt={'Photo de '+selected.values[0]}/>}
   <p><strong>Quantité :</strong> {selected.values[1]||'À préciser'}</p>
   <p><strong>Emplacement / prêt :</strong> {selected.values[2]||'À préciser'}</p>
   <div className="festapp-equipment-detail-actions">
    <button type="button" onClick={()=>{onEdit(selected);setSelectedId('');}} disabled={readOnly}>✏️ Modifier</button>
    <label className="festapp-equipment-photo-action"><ModuleGlyph kind="camera"/> Ajouter une photo à ce matériel<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif" disabled={readOnly||busy} onChange={addPhoto}/></label>
    <button type="button" className="delete" onClick={()=>{onDelete(selected.id);setSelectedId('');}} disabled={readOnly}>Supprimer</button>
   </div>
   {status&&<p role="status">{status}</p>}
  </section></div>}
 </section>;
}
