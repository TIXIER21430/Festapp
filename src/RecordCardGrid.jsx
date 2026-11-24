import React,{useEffect,useRef,useState} from 'react';
import {PHOTO_CATEGORIES,listPhotoOriginals,savePhotoOriginal} from './lib/photoVault.js';
import {isTillAccountingRecord} from './lib/tillSales.js';
import ModuleGlyph from './ModuleGlyph.jsx';
import StockIllustration from './StockIllustration.jsx';
import {STOCK_GROUPS,stockGroup,stockUnit} from './lib/stockCatalog.js';

const PHOTO_SCOPES=new Set(PHOTO_CATEGORIES.filter(scope=>scope!=='equipment'));

export function cardSummary(category,record){
 const values=record?.values||[];
 if(category==='stock')return values[1]?'Quantité : '+values[1]+(stockUnit(values[0])&&/^\d+(?:[.,]\d+)?$/.test(values[1])?' '+stockUnit(values[0]):''):'Quantité à préciser';
 if(category==='recipes')return 'Recette du comité';
 if(category==='contacts')return values[1]||'Contact';
 if(category==='tasks')return record.done?'Terminée':'À faire';
 if(category==='shifts')return [values[2],values[1]].filter(Boolean).join(' · ')||'Créneau à préciser';
 if(category==='finance')return [values[1]&&values[1]+' €',values[2]].filter(Boolean).join(' · ')||'Montant à préciser';
 if(category==='posts')return values[2]||'Publication à préparer';
 if(category==='archives')return values[1]||'Archive';
 return [values[1],values[2]].filter(Boolean).join(' · ')||'Fiche à compléter';
}

export default function RecordCardGrid({category,fields,records=[],readOnly=false,onEdit,onDelete,onToggleDone,onCalculateRecipe,photoRevision=0,onPhotoChange}){
 const [photos,setPhotos]=useState(new Map());
 const [selectedId,setSelectedId]=useState('');
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 const [groupFilter,setGroupFilter]=useState('all');
 const visible=category==='stock'&&groupFilter!=='all'?records.filter(r=>stockGroup(r.values[0])===groupFilter):records;
 const closeRef=useRef(null);
 const selected=records.find(row=>row.id===selectedId);
 const lockedTillEntry=category==='finance'&&isTillAccountingRecord(selected);
 const supportsPhotos=PHOTO_SCOPES.has(category);

 useEffect(()=>{if(selectedId)closeRef.current?.focus();},[selectedId]);
 useEffect(()=>{
  let active=true;
  const urls=[];
  if(!PHOTO_SCOPES.has(category)){setPhotos(new Map());return;}
  listPhotoOriginals(category).then(rows=>{
   if(!active)return;
   const mapped=new Map();
   for(const photo of rows){
    if(!photo.recordId||mapped.has(photo.recordId))continue;
    const url=URL.createObjectURL(photo.blob);
    urls.push(url);mapped.set(photo.recordId,url);
   }
   setPhotos(mapped);
  }).catch(()=>{if(active)setPhotos(new Map());});
  return ()=>{active=false;urls.forEach(url=>URL.revokeObjectURL(url));};
 },[category,photoRevision]);

 async function addPhoto(event){
  const file=event.target.files?.[0];event.target.value='';
  if(!file||!selected||busy||readOnly||!supportsPhotos)return;
  setBusy(true);setStatus('');
  try{await savePhotoOriginal(file,category,selected.id);setStatus('✅ Photo conservée sur cet appareil.');onPhotoChange?.();}
  catch(error){setStatus('⚠ '+(error.message||'Photo impossible à enregistrer.'));}
  finally{setBusy(false);}
 }

 return <section className="festapp-card-catalog" data-category={category} aria-label="Fiches en quadrillage">
  {category==='stock'&&<label>Famille de produits<select value={groupFilter} onChange={e=>setGroupFilter(e.target.value)}><option value="all">Toutes les familles</option>{STOCK_GROUPS.map(g=><option key={g}>{g}</option>)}</select></label>}
  {visible.length>0?<div className="festapp-record-grid">{visible.map((record,i)=>{
   const image=photos.get(record.id);
   return <React.Fragment key={record.id}>{category==='stock'&&(i===0||stockGroup(visible[i-1].values[0])!==stockGroup(record.values[0]))&&<h3 className="stock-group-heading">{stockGroup(record.values[0])}</h3>}<article key={record.id} className="festapp-record-tile">
    <button type="button" className="festapp-record-preview" aria-label={'Ouvrir '+record.values[0]} aria-expanded={selectedId===record.id} onClick={()=>{setSelectedId(record.id);setStatus('');}}>
     <span className="festapp-record-image">{image?<img src={image} alt={'Photo associée à '+record.values[0]} loading="lazy"/>:category==='stock'?<StockIllustration name={record.values[0]}/>:<span className="festapp-icon-frame" aria-hidden="true"><ModuleGlyph kind={category}/></span>}</span>
     <span className="festapp-record-copy"><strong>{record.values[0]}</strong><small>{cardSummary(category,record)}</small></span>
    </button>
    {category==='tasks'&&<label className="festapp-record-check"><input type="checkbox" checked={record.done===true} disabled={readOnly} onChange={()=>onToggleDone(record.id)}/>{record.done?'Terminée':'À faire'}</label>}
   </article></React.Fragment>;
  })}</div>:<p className="festapp-equipment-empty">Aucune fiche trouvée. Utilise « + Ajouter » pour commencer.</p>}
  {selected&&<div className="festapp-equipment-backdrop" onClick={()=>setSelectedId('')}>
   <section className="festapp-equipment-detail" role="dialog" aria-modal="true" aria-label={'Fiche : '+selected.values[0]} onClick={e=>e.stopPropagation()} onKeyDown={e=>{if(e.key==='Escape')setSelectedId('');}}>
    <div className="festapp-equipment-detail-heading"><h3>{selected.values[0]}</h3><button type="button" className="secondary" ref={closeRef} aria-label="Fermer la fiche" onClick={()=>setSelectedId('')}>✕</button></div>
    {photos.get(selected.id)?<img className="festapp-equipment-detail-image" src={photos.get(selected.id)} alt={'Photo de '+selected.values[0]}/>:category==='stock'?<div className="festapp-stock-detail-art"><StockIllustration name={selected.values[0]}/><small>Illustration indicative · ajoute une photo réelle si nécessaire.</small></div>:null}
    {category==='recipes'&&<button type="button" className="festapp-recipe-calculate-action" onClick={()=>{onCalculateRecipe?.(selected);setSelectedId('');}}>🧮 Adapter les quantités</button>}
    {fields.slice(1).map((field,i)=><p key={field}><strong>{field} :</strong> {selected.values[i+1]||'À préciser'}</p>)}
    {category==='contacts'&&<>{selected.phone&&<p><a href={'tel:'+selected.phone}>📞 {selected.phone}</a></p>}{selected.email&&<p><a href={'mailto:'+selected.email}>✉️ {selected.email}</a></p>}</>}
    {category==='archives'&&/^https:\/\/(?:drive|docs)\.google\.com\//.test(selected.values[2]||'')&&<p><a href={selected.values[2]} target="_blank" rel="noopener noreferrer">📄 Voir l’original dans Drive</a></p>}
    {lockedTillEntry&&<p className="note">🔒 Écriture de caisse conservée pour l’historique. Pour corriger une vente, ouvre sa manifestation puis la caisse et utilise « Annuler cette vente ».</p>}
    <div className="festapp-equipment-detail-actions">{!lockedTillEntry&&<button type="button" disabled={readOnly} onClick={()=>{onEdit(selected);setSelectedId('');}}>✏️ Modifier</button>}
     {supportsPhotos&&<label className="festapp-equipment-photo-action"><ModuleGlyph kind="camera"/> Ajouter une photo à cette fiche<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif" disabled={readOnly||busy} onChange={addPhoto}/></label>}
     {!lockedTillEntry&&<button type="button" className="delete" disabled={readOnly} onClick={()=>{onDelete(selected.id);setSelectedId('');}}>Supprimer</button>}
    </div>
    {status&&<p role="status">{status}</p>}
   </section>
  </div>}
 </section>;
}
