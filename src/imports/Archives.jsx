import React,{useState} from "react";
import {archives,financeFolders} from "./archiveCatalog.js";
export default function Archives(){
 const [type,setType]=useState("Compte rendu");
 const shown=archives.filter(a=>a.type===type);
 return <div className="recipe-module">
 <p className="note">Archives officielles du Comité. Les originaux sont ouverts dans Google Drive et restent soumis à ses droits d'accès. La lecture et l'indexation du texte intégral ne sont pas encore synchronisées dans FEST'APP.</p>
 <label>Catégorie<select value={type} onChange={e=>setType(e.target.value)}>{["Compte rendu","Bilan","Assemblée"].map(t=><option key={t}>{t}</option>)}</select></label>
 <div className="records">{shown.map(a=><article key={a.id}><div><strong>{a.title}</strong><p>{a.date}</p><p><a href={"https://drive.google.com/file/d/"+a.id+"/view"} target="_blank" rel="noopener noreferrer">Consulter le document original</a></p></div></article>)}</div>
 {type==="Bilan"&&<><h3>Dossiers comptables</h3><div className="records">{financeFolders.map(f=><article key={f.id}><a href={"https://drive.google.com/drive/folders/"+f.id} target="_blank" rel="noopener noreferrer">{f.title}</a></article>)}</div></>}
 </div>
}