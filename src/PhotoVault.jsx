import React,{useEffect,useState} from "react";
import {deletePhotoOriginal,listPhotoOriginals,savePhotoOriginal} from "./lib/photoVault.js";

function OriginalCard({photo,title,onDelete,readOnly}){
 const [src,setSrc]=useState("");
 useEffect(()=>{const url=URL.createObjectURL(photo.blob);setSrc(url);return()=>URL.revokeObjectURL(url);},[photo.blob]);
 function download(){const url=URL.createObjectURL(photo.blob);const a=document.createElement("a");a.href=url;a.download=photo.fileName;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
 return <article className="photo-card">
  {src&&<img src={src} alt={"Photo d’origine : "+photo.fileName} loading="lazy"/>}
  <div><strong>{photo.fileName}</strong><small>{title||"Sans fiche associée"} · {(photo.size/1_000_000).toFixed(1)} Mo</small></div>
  <div className="photo-actions"><button type="button" onClick={download}>⬇ Original</button><button type="button" className="delete" disabled={readOnly} onClick={()=>onDelete(photo)}>Supprimer</button></div>
 </article>;
}

export default function PhotoVault({scope,records=[],readOnly=false}){
 const [photos,setPhotos]=useState([]);
 const [recordId,setRecordId]=useState("");
 const [status,setStatus]=useState("");
 const [busy,setBusy]=useState(false);
 async function refresh(){const list=await listPhotoOriginals(scope);setPhotos(list);}
 useEffect(()=>{let active=true;listPhotoOriginals(scope).then(rows=>{if(active)setPhotos(rows);}).catch(err=>{if(active)setStatus("⚠ "+err.message);});return()=>{active=false;};},[scope]);
 async function addPhotos(e){
  const files=Array.from(e.target.files||[]);e.target.value="";
  if(!files.length||busy||readOnly)return;
  if(files.length>6){setStatus("⚠ Ajoutez au maximum six photos à la fois.");return;}
  setBusy(true);let saved=0;
  try{
   if(photos.length+files.length>100)throw new Error("Limite de 100 photos locales par rubrique. Téléchargez des originaux avant de libérer de la place.");
   for(const file of files){await savePhotoOriginal(file,scope,recordId);saved++;}
   setStatus(`${saved} photo(s) originale(s) conservée(s) sur cet appareil.`);
  }catch(err){setStatus(`⚠ ${saved} photo(s) conservée(s). ${err.message}`);}
  finally{try{await refresh();}catch(err){setStatus("⚠ Photos enregistrées mais liste non disponible : "+err.message);}setBusy(false);}
 }
 async function remove(photo){
  if(readOnly||busy||!window.confirm("Supprimer définitivement cette photo locale ? Téléchargez d’abord l’original si vous voulez la garder."))return;
  setBusy(true);
  try{await deletePhotoOriginal(photo.id);await refresh();setStatus("Photo locale supprimée.");}
  catch(err){setStatus("⚠ "+err.message);}
  finally{setBusy(false);}
 }
 return <section className="photo-vault" aria-label="Photos originales locales">
  <h3>📸 Photos originales</h3>
  <p>Ajoutez une photo de recette, de facture, de matériel, d’affiche ou de manifestation. Le fichier reste <strong>inchangé</strong> sur cet appareil et peut être téléchargé à tout moment.</p>
  <div className="photo-add-row">
   <label>Associer à une fiche<select value={recordId} onChange={e=>setRecordId(e.target.value)}><option value="">Sans fiche / général</option>{records.map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label>
   <label className="photo-upload">📷 Ajouter des photos<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif" multiple disabled={readOnly||busy} onChange={addPhotos}/></label>
  </div>
  {status&&<p role="status">{status}</p>}
  <div className="photo-gallery">{photos.map(photo=><OriginalCard key={photo.id} photo={photo} title={records.find(r=>r.id===photo.recordId)?.values[0]} onDelete={remove} readOnly={readOnly||busy}/>)}</div>
  {!photos.length&&<p>Pas encore de photo dans cette rubrique.</p>}
  <p className="photo-warning">⚠ Les photos ne sont <strong>pas incluses dans la sauvegarde JSON</strong> : téléchargez les originaux avant de changer de téléphone ou de vider le navigateur. Aucun envoi vers Supabase, Facebook ou une IA.</p>
 </section>;
}
