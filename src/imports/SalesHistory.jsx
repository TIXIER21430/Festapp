import React,{useState} from "react";
import {importSalesHistory} from "./sales.js";
const KEY="festapp-sales-history-v1";
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}}
export default function SalesHistory(){
 const [records,setRecords]=useState(load),[event,setEvent]=useState(""),[error,setError]=useState("");
 async function upload(e){const file=e.target.files?.[0];if(!file)return;setError("");try{
   const text=await file.text(),next=importSalesHistory(text);
   if(!next.length)throw Error("Aucune quantité reconnue. Vérifiez le format du tableau.");
   localStorage.setItem(KEY,JSON.stringify(next));setRecords(next);
 }catch(err){setError(err.message)}}
 const events=[...new Set(records.map(r=>r.event))];
 const visible=event?records.filter(r=>r.event===event):records;
 return <div className="recipe-module">
 <p className="note">Importez une copie CSV du tableau « Quantités vendues ». Le fichier original reste intact dans Google Drive. Ces données restent sur cet appareil et ne sont pas synchronisées.</p>
 <label>Importer le tableau (CSV, séparateur virgule ou point-virgule)<input type="file" accept=".csv,text/csv,text/plain" onChange={upload}/></label>
 {error&&<p role="alert" className="note">{error}</p>}
 <p>{records.length} lignes de ventes historiques importées.</p>
 <label>Manifestation<select value={event} onChange={e=>setEvent(e.target.value)}><option value="">Toutes les manifestations</option>{events.map(x=><option key={x} value={x}>{x}</option>)}</select></label>
 <div className="records">{visible.map((r,i)=><article key={i}><div><strong>{r.product}</strong><p>{r.event} · {r.quantityText}</p></div></article>)}</div>
 {records.length>0&&<button className="secondary" onClick={()=>{if(confirm("Effacer l'historique importé sur cet appareil ?")){localStorage.removeItem(KEY);setRecords([])}}}>Effacer l'import local</button>}
 </div>
}