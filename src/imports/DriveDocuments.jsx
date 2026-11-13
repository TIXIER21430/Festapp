import React,{useState} from "react";
import {eventDocuments,eventFolders} from "./driveCatalog.js";
const KEY="festapp-drive-links-v1";
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}}
export default function DriveDocuments(){
 const [custom,setCustom]=useState(load),[event,setEvent]=useState("Saint-Laurent"),[title,setTitle]=useState(""),[url,setUrl]=useState("");
 const events=[...new Set([...Object.keys(eventFolders),...custom.map(x=>x.event)])];
 const documents=[...(eventDocuments[event]||[]).map(x=>({...x,url:"https://drive.google.com/file/d/"+encodeURIComponent(x.id)+"/view",builtIn:true})),...custom.filter(x=>x.event===event)];
 function add(e){e.preventDefault();try{const parsed=new URL(url);if(parsed.protocol!=="https:"||!["drive.google.com","docs.google.com"].includes(parsed.hostname))throw Error();const next=[...custom,{event,title:title.trim(),url:parsed.href}];localStorage.setItem(KEY,JSON.stringify(next));setCustom(next);setTitle("");setUrl("")}catch{alert("Saisissez un lien Google Drive ou Google Docs valide (https).")}}
 return <div className="recipe-module">
 <p className="note">Catalogue de liens vers les originaux du Drive du Comité. L'accès aux fichiers dépend des autorisations Google du compte connecté. Les liens ajoutés ici restent locaux à cet appareil.</p>
 <label>Manifestation<select value={event} onChange={e=>setEvent(e.target.value)}>{events.map(x=><option key={x}>{x}</option>)}</select></label>
 {eventFolders[event]&&<p><a target="_blank" rel="noopener noreferrer" href={"https://drive.google.com/drive/folders/"+eventFolders[event]}>📁 Ouvrir le dossier de la manifestation</a></p>}
 <div className="records">{documents.map((doc,i)=><article key={i}><div><strong>{doc.title}</strong><p><a target="_blank" rel="noopener noreferrer" href={doc.url}>Ouvrir dans Google Drive</a></p></div>{!doc.builtIn&&<button className="delete" onClick={()=>{const next=custom.filter(x=>x!==doc);localStorage.setItem(KEY,JSON.stringify(next));setCustom(next)}}>Retirer</button>}</article>)}</div>
 <h3>Ajouter un document</h3><form onSubmit={add} className="recipe-form"><label>Nom du document<input required value={title} onChange={e=>setTitle(e.target.value)}/></label><label>Lien Google Drive<input type="url" required value={url} onChange={e=>setUrl(e.target.value)}/></label><button type="submit">Ajouter le lien</button></form>
 </div>
}