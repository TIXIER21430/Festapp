import React,{useMemo,useState} from 'react';

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
  <div className="drive-board-top"><div><h2>🗂️ Le Drive du comité</h2><p>Documents du Comité des fêtes de Liernais, retrouvables en quelques secondes.</p></div><span className="drive-count">{count} fichiers</span></div>
  {loading&&<p role="status">Chargement du catalogue Drive…</p>}
  {error&&<p role="alert">⚠ {error}</p>}
  {catalog&&<>
   <div className="drive-stats" aria-label="Répartition des fichiers"><span>📄 {catalog.stats.documents} documents</span><span>🖼️ {catalog.stats.images} images</span><span>🎵 {catalog.stats.audio} sons</span><span>🎬 {catalog.stats.videos} vidéos</span></div>
   <div className="drive-source"><div><strong>✨ Fiches préparées depuis le Drive</strong><small>Marché de Noël 2026, achats, listes de tâches, bilans 2025 et retours terrain. Import local sans écraser tes fiches.</small></div><button type="button" disabled={readOnly} onClick={onImport}>➕ Ajouter les fiches manquantes</button></div>
   {importStatus&&<p className="drive-import-status" role="status">{importStatus}</p>}
   <div className="drive-search"><label>🔎 Chercher un document<input type="search" value={term} onChange={e=>{setTerm(e.target.value);setLimit(35);}} placeholder="Ex. bilan, Noël, facture, affiche…"/></label><label>📁 Dossier<select value={category} onChange={e=>{setCategory(e.target.value);setLimit(35);}}>{filters.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label></div>
   <p className="drive-results" role="status">{matches.length} document(s) trouvé(s) · inventaire du {catalog.asOf}</p>
   <div className="drive-file-list">{visible.map(file=><article key={file.id} className="drive-file"><span aria-hidden="true">{icons[file.type]||icons.other}</span><div><strong>{file.title}</strong><small>{file.folder}</small></div>{isSafeDriveLink(file.url)&&<a href={file.url} target="_blank" rel="noopener noreferrer" aria-label={'Ouvrir dans le Drive : '+file.title}>Ouvrir ↗</a>}</article>)}</div>
   {!matches.length&&<p>Aucun document dans cette recherche.</p>}
   {matches.length>limit&&<button type="button" className="drive-more" onClick={()=>setLimit(n=>n+70)}>Afficher 70 documents de plus ({Math.min(limit,matches.length)}/{matches.length})</button>}
   <p className="drive-caution">🔒 Les fichiers originaux restent dans Google Drive. Les liens exigent les droits du comité. Il s’agit d’un inventaire daté, pas d’une synchronisation automatique ; les données de travail restent locales tant que le partage Supabase n’est pas activé.</p>
  </>}
 </section>;
}
