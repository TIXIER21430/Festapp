import React,{useMemo,useState} from 'react';
import {DRIVE_FOLDERS} from './lib/driveFolders.js';

const filters=[['Tous','Tous les fichiers'],['Administratif','📊 Administratif'],['Manifestations','🎉 Manifestations'],['Communication','📣 Communication'],['Economat','📦 Stocks'],['Compte rendu','📝 Comptes rendus'],['Subventions','🤝 Subventions'],['Matériel','🧰 Matériel'],['Drive/','📁 Racine']];
const icons={pdf:'📕',image:'🖼️',audio:'🎵',video:'🎬',document:'📄',spreadsheet:'📊',other:'📁'};
const isSafeDriveLink=url=>/^https:\/\/(drive|docs)\.google\.com\//.test(url||'');

export default function DriveBoard({catalog,loading,error,importStatus,onImport,readOnly}) {
 const [term,setTerm]=useState('');
 const [category,setCategory]=useState('Tous');
 const [limit,setLimit]=useState(35);
 const matches=useMemo(()=>{
  const q=term.trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return (catalog?.files||[]).filter(file=>(category==='Tous'||file.folder.startsWith(category))&&(!q||`${file.title} ${file.folder} ${file.type}`.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().includes(q)));
 },[catalog,term,category]);
 const visible=matches.slice(0,limit);
 const count=catalog?.files?.length||0;
 return <section id="drive-library" className="drive-board" aria-label="Documents Google Drive du comité">
  <div className="drive-board-top"><div><h2>🗂️ Le Drive du comité</h2><p>{catalog?'Retrouve un document en quelques secondes.':'Ouvre directement les dossiers du comité dans Google Drive.'}</p></div><span className="drive-count">{catalog?`${count} fichiers`:'Accès Drive'}</span></div>
  {loading&&<p role="status">Chargement du catalogue Drive…</p>}
  {!catalog&&!loading&&<div className="drive-fallback"><h3>📁 Accéder aux dossiers</h3><p>Le catalogue de recherche interne n'est pas encore disponible. Les documents restent accessibles dans le Drive d'origine, avec les droits habituels du comité.</p><div className="drive-fallback-grid">{DRIVE_FOLDERS.map(folder=><a key={folder.name} href={folder.url} target="_blank" rel="noopener noreferrer">{folder.icon} {folder.name}</a>)}</div></div>}
  {catalog&&<>
   <div className="drive-stats" aria-label="Répartition des fichiers"><span>📄 {catalog.stats.documents} documents</span><span>🖼️ {catalog.stats.images} images</span><span>🎵 {catalog.stats.audio} sons</span><span>🎬 {catalog.stats.videos} vidéos</span></div>
   {catalog.seed&&<div className="drive-source"><div><strong>✨ Fiches préparées depuis le Drive</strong><small>Import local sans écraser tes fiches.</small></div><button type="button" disabled={readOnly} onClick={onImport}>➕ Ajouter les fiches manquantes</button></div>}
   {importStatus&&<p className="drive-import-status" role="status">{importStatus}</p>}
   <div className="drive-search"><label>🔎 Chercher un document<input type="search" value={term} onChange={e=>{setTerm(e.target.value);setLimit(35);}} placeholder="Ex. bilan, Noël, facture, affiche…"/></label><label>📁 Dossier<select value={category} onChange={e=>{setCategory(e.target.value);setLimit(35);}}>{filters.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
   <p className="drive-results" role="status">{matches.length} document(s) trouvé(s) · inventaire du {catalog.asOf}</p>
   <div className="drive-file-list">{visible.map(file=><article key={file.id} className="drive-file"><span aria-hidden="true">{icons[file.type]||icons.other}</span><div><strong>{file.title}</strong><small>{file.folder}</small></div>{isSafeDriveLink(file.url)&&<a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={'Ouvrir dans le Drive : '+file.title}>Ouvrir ↗</a>}</article>)}</div>
   {!matches.length&&<p>Aucun document dans cette recherche.</p>}
   {matches.length>limit&&<button type="button" className="drive-more" onClick={()=>setLimit(n=>n+70)}>Afficher 70 documents de plus ({Math.min(limit,matches.length)}/{matches.length})</button>}
   <p className="drive-caution">🔒 Inventaire privé réservé aux membres connectés au comité sur Supabase TEST. Les originaux restent dans Google Drive et nécessitent leurs droits habituels. Cet inventaire est daté et ne synchronise pas automatiquement les documents.</p>
  </>}
 </section>;
}
