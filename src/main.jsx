import React,{useEffect,useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";
import Recipes from "./recipes/Recipes.jsx";
import SalesHistory from "./imports/SalesHistory.jsx";

const categories=[
{key:"events",title:"Manifestations",icon:"🎉",fields:["Nom","Date","Lieu"]},
{key:"tasks",title:"Tâches",icon:"✅",fields:["Tâche","Responsable","Échéance"]},
{key:"shopping",title:"Achats",icon:"🛒",fields:["Article","Quantité","État"]},
{key:"stock",title:"Stock",icon:"📦",fields:["Article","Quantité","Seuil d'alerte"]},
{key:"ecocups",title:"Écocups",icon:"🥤",fields:["Mouvement","Quantité","Manifestation"]},
{key:"contacts",title:"Annuaire",icon:"👥",fields:["Nom","Catégorie","Contact"]},
{key:"shifts",title:"Planning bénévoles",icon:"🕒",fields:["Bénévole","Créneau","Poste"]},
{key:"feedback",title:"Retours terrain",icon:"📝",fields:["Manifestation","Type","Remarque"]},
{key:"history",title:"Historique ventes",icon:"📋",fields:["Produit","Manifestation","Quantité"]},
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
 useEffect(()=>{localStorage.setItem(storageKey,JSON.stringify(data))},[data]);
 const current=categories.find(c=>c.key===tab);
 const records=(data[tab]||[]).filter(r=>r.values.join(" ").toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
 function add(e){e.preventDefault();if(!form[0].trim())return;setData(d=>({...d,[tab]:[...(d[tab]||[]),{id:crypto.randomUUID(),values:form.map(x=>x.trim())}]}));setForm(["","",""])}
 function remove(id){if(!confirm("Supprimer cette fiche ?"))return;setData(d=>({...d,[tab]:(d[tab]||[]).filter(r=>r.id!==id)}))}
 function exportCsv(){const rows=[current.fields,...(data[tab]||[]).map(r=>r.values)];const csv="\uFEFF"+rows.map(row=>row.map(x=>'"'+String(x||"").replaceAll('"','""')+'"').join(";")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="festapp-"+tab+".csv";a.click();URL.revokeObjectURL(a.href)}
 return <main>
 <header><div>🎆 FEST'APP <small>Comité des fêtes de Liernais</small></div><span className="demo">Mode démonstration</span></header>
 <section className="hero"><h1>Organisons nos fêtes !</h1><p>Manifestations, bénévoles, stocks et bilans au même endroit.</p><strong>⚠ Données enregistrées uniquement sur cet appareil, non partagées avec le bureau.</strong></section>
 <nav aria-label="Modules">{categories.map(c=><button key={c.key} className={tab===c.key?"active":""} onClick={()=>{setTab(c.key);setForm(["","",""]);setFilter("")}}>{c.icon} {c.title}</button>)}</nav>
 <section className="panel"><div className="heading"><h2>{current.icon} {current.title}</h2><button className="secondary" onClick={exportCsv}>Exporter CSV</button></div>
 {tab==="ecocups"&&<p className="note">Enregistrez les mouvements d'écocups. Le suivi des consignes et l'alerte automatique seront connectés à la base partagée.</p>}
 {tab==="recipes"?<Recipes/>:tab==="history"?<SalesHistory/>:<><form onSubmit={add}><div className="fields">{current.fields.map((label,i)=><label key={label}>{label}<input required={i===0} value={form[i]} onChange={e=>setForm(f=>f.map((v,j)=>i===j?e.target.value:v))} placeholder={label}/></label>)}</div><button type="submit">+ Ajouter</button></form>
 <label className="search">Rechercher<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrer les fiches…"/></label>
 <div className="records">{records.length?records.map(r=><article key={r.id}><div><strong>{r.values[0]}</strong><p>{r.values.slice(1).filter(Boolean).join(" · ")||"Aucune précision"}</p></div><button className="delete" onClick={()=>remove(r.id)} aria-label={"Supprimer "+r.values[0]}>Supprimer</button></article>):<p>Aucune fiche pour le moment.</p>}</div>
 </>}</section><footer>Prototype local • aucune donnée synchronisée • TIXAPP reste indépendant</footer>
 </main>
}
createRoot(document.getElementById("root")).render(<App/>);
