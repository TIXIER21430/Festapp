import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";

const categories=[
{key:"events",title:"Manifestations",icon:"🎉",fields:["Nom","Date","Lieu"]},
{key:"tasks",title:"Tâches",icon:"✅",fields:["Tâche","Responsable","Échéance"]},
{key:"shopping",title:"Achats",icon:"🛒",fields:["Article","Quantité","État"]},
{key:"stock",title:"Stock",icon:"📦",fields:["Article","Quantité","Seuil d'alerte"]},
{key:"ecocups",title:"Écocups",icon:"🥤",fields:["Mouvement","Quantité","Manifestation"]},
{key:"contacts",title:"Annuaire",icon:"👥",fields:["Nom","Catégorie","Contact"]},
{key:"shifts",title:"Planning bénévoles",icon:"🕒",fields:["Bénévole","Créneau","Poste"]},
{key:"feedback",title:"Retours terrain",icon:"📝",fields:["Manifestation","Type","Remarque"]},
{key:"recipes",title:"Recettes",icon:"🍲",fields:["Nom","Ingrédients","Préparation"]},
{key:"finance",title:"Finances",icon:"📊",fields:["Manifestation","Montant (€)","Nature"]}
];
const eventNames=["Concours de belote","Carnaval","Chasse aux œufs","Fête des voisins","Fanfare","Vide-grenier","Saint-Laurent","Halloween","Marché de Noël"];
const seed={events:eventNames.map((name,i)=>({id:"seed-"+i,values:[name,"",""]}))};
const storageKey="festapp-demo-v1";
function load(){try{return {...seed,...JSON.parse(localStorage.getItem(storageKey)||"{}")}}catch{return seed}}
function App(){
 const [data,setData]=useState(load);
 const [tab,setTab]=useState("events");
 const [form,setForm]=useState(["","",""]);
 const [filter,setFilter]=useState("");
 const backupFileRef=useRef(null);
 const [ecocupThreshold,setEcocupThreshold]=useState(()=>{const n=Number(localStorage.getItem("festapp-ecocups-seuil"));return Number.isFinite(n)&&n>=0?n:100});
 useEffect(()=>{localStorage.setItem(storageKey,JSON.stringify(data))},[data]);
 useEffect(()=>{localStorage.setItem("festapp-ecocups-seuil",String(ecocupThreshold))},[ecocupThreshold]);
 const ecocupMovements=(data.ecocups||[]).filter(r=>r.values[0]==="Entrée"||r.values[0]==="Sortie");
 const ecocupBalance=ecocupMovements.reduce((sum,r)=>sum+(r.values[0]==="Entrée"?1:-1)*Number(r.values[1]||0),0);
 const invalidEcocupHistory=(data.ecocups||[]).length!==ecocupMovements.length;
 const validEcocupMovements=ecocupMovements.every(r=>Number.isSafeInteger(Number(r.values[1]))&&Number(r.values[1])>0);
 const current=categories.find(c=>c.key===tab);
 const records=(data[tab]||[]).filter(r=>r.values.join(" ").toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
 function add(e){e.preventDefault();if(!form[0].trim())return;
  if(tab==="ecocups"){
   const quantity=Number(form[1]);
   if(!["Entrée","Sortie"].includes(form[0])||!Number.isSafeInteger(quantity)||quantity<=0){alert("Choisissez Entrée ou Sortie et une quantité entière positive.");return}
   if(form[0]==="Sortie"&&quantity>ecocupBalance){alert("Stock insuffisant : impossible de sortir plus d’écocups que le solde disponible.");return}
  }
  setData(d=>({...d,[tab]:[...(d[tab]||[]),{id:crypto.randomUUID(),values:form.map(x=>x.trim())}]}));setForm(["","",""])}

 function remove(id){if(!confirm("Supprimer cette fiche ?"))return;setData(d=>({...d,[tab]:(d[tab]||[]).filter(r=>r.id!==id)}))}
 function downloadBackup(){const payload={format:"festapp-backup",version:1,createdAt:new Date().toISOString(),ecocupThreshold,data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="festapp-sauvegarde-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function restoreBackup(event){const file=event.target.files?.[0];event.target.value="";if(!file)return;try{if(file.size>5_000_000)throw new Error("Fichier trop volumineux (maximum 5 Mo).");const backup=JSON.parse(await file.text());if(backup?.format!=="festapp-backup"||backup.version!==1||!backup.data||typeof backup.data!=="object"||Array.isArray(backup.data))throw new Error("Format de sauvegarde non reconnu.");const restored={};for(const c of categories){const rows=backup.data[c.key]??[];if(!Array.isArray(rows)||rows.length>10000||!rows.every(r=>r&&typeof r.id==="string"&&Array.isArray(r.values)&&r.values.length===c.fields.length&&r.values.every(v=>typeof v==="string")))throw new Error("Données invalides pour "+c.title);restored[c.key]=rows}const threshold=Number(backup.ecocupThreshold);if(!Number.isSafeInteger(threshold)||threshold<0)throw new Error("Seuil d’alerte invalide.");if(!confirm("Restaurer cette sauvegarde ? Les données locales actuelles seront remplacées. Sauvegardez-les d’abord si nécessaire."))return;setData(restored);setEcocupThreshold(threshold);setFilter("");setForm(["","",""]);alert("Sauvegarde restaurée sur cet appareil.")}catch(error){alert("Restauration impossible : "+error.message)}}
 function exportCsv(){const rows=[current.fields,...(data[tab]||[]).map(r=>r.values)];const csv="\uFEFF"+rows.map(row=>row.map(x=>'"'+String(x||"").replaceAll('"','""')+'"').join(";")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="festapp-"+tab+".csv";a.click();URL.revokeObjectURL(a.href)}
 return <main>
 <header><div>🎆 FEST'APP <small>Comité des fêtes de Liernais</small></div><span className="demo">Mode démonstration</span></header>
 <section className="hero"><h1>Organisons nos fêtes !</h1><p>Manifestations, bénévoles, stocks et bilans au même endroit.</p><strong>⚠ Données enregistrées uniquement sur cet appareil, non partagées avec le bureau.</strong></section>
 <div className="backup-tools"><button className="secondary" onClick={downloadBackup}>💾 Sauvegarder toutes les données</button><button className="secondary" onClick={()=>backupFileRef.current?.click()}>📂 Restaurer une sauvegarde</button><input ref={backupFileRef} type="file" accept=".json,application/json" onChange={restoreBackup} style={{display:"none"}} aria-label="Choisir une sauvegarde FESTAPP"/><small>Transfert manuel uniquement : aucune synchronisation entre appareils.</small></div>
 <nav aria-label="Modules">{categories.map(c=><button key={c.key} className={tab===c.key?"active":""} onClick={()=>{setTab(c.key);setForm(["","",""]);setFilter("")}}>{c.icon} {c.title}</button>)}</nav>
 <section className="panel"><div className="heading"><h2>{current.icon} {current.title}</h2><button className="secondary" onClick={exportCsv}>Exporter CSV</button></div>
 {tab==="ecocups"&&<div className="ecocup-summary"><p><strong>Stock calculé : {ecocupBalance} écocups</strong> — {ecocupBalance<=ecocupThreshold?"⚠ Stock au seuil ou en dessous":"✓ Stock au-dessus du seuil"}</p><label>Seuil d’alerte<input type="number" min="0" step="1" value={ecocupThreshold} onChange={e=>{const n=Number(e.target.value);if(Number.isSafeInteger(n)&&n>=0)setEcocupThreshold(n)}}/></label><p className="note">Enregistrez d’abord une entrée pour le stock initial, puis les entrées et sorties. Le solde est recalculé automatiquement. Données conservées sur cet appareil uniquement.</p>{!validEcocupMovements&&<p className="note">⚠ Certaines quantités sont invalides : le solde peut être incorrect. Vérifiez les mouvements.</p>}{invalidEcocupHistory&&<p className="note">⚠ Des anciennes fiches au format libre ne sont pas comptabilisées. Vérifiez-les et ressaisissez leurs mouvements.</p>}</div>}
 <form onSubmit={add}><div className="fields">{current.fields.map((label,i)=><label key={label}>{label}{tab==="ecocups"&&i===0?<select required value={form[i]} onChange={e=>setForm(f=>f.map((v,j)=>i===j?e.target.value:v))}><option value="">Choisir un mouvement</option><option value="Entrée">Entrée (+)</option><option value="Sortie">Sortie (−)</option></select>:<input required={i===0||(tab==="ecocups"&&i===1)} type={tab==="ecocups"&&i===1?"number":"text"} min={tab==="ecocups"&&i===1?"1":undefined} step={tab==="ecocups"&&i===1?"1":undefined} value={form[i]} onChange={e=>setForm(f=>f.map((v,j)=>i===j?e.target.value:v))} placeholder={label}/>}</label>)}</div><button type="submit">+ Ajouter</button></form>
 <label className="search">Rechercher<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrer les fiches…"/></label>
 <div className="records">{records.length?records.map(r=><article key={r.id}><div><strong>{r.values[0]}</strong><p>{r.values.slice(1).filter(Boolean).join(" · ")||"Aucune précision"}</p></div><button className="delete" onClick={()=>remove(r.id)} aria-label={"Supprimer "+r.values[0]}>Supprimer</button></article>):<p>Aucune fiche pour le moment.</p>}</div>
 </section><footer>Prototype local • aucune donnée synchronisée • TIXAPP reste indépendant</footer>
 </main>
}
createRoot(document.getElementById("root")).render(<App/>);
