import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";
import {buildCsv} from "./lib/csv.js";
import {summarizeEcocups} from "./lib/ecocupDemoBalance.js";
import {ECOCUP_DEMO_SETTINGS_KEY,parseDemoEcocupSettings,serializeDemoEcocupSettings} from "./lib/ecocupDemoSettings.js";
import {createDemoBackup} from "./lib/demoBackup.js";
import {readDemoStorage,writeDemoStorage} from "./lib/demoStorage.js";
import {inspectDemoBackupReadiness} from "./lib/demoBackupReadiness.js";
import {planDemoRestore} from "./lib/demoRestorePlan.js";
import {applyDemoRestore} from "./lib/applyDemoRestore.js";

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
function load(){return readDemoStorage(localStorage,seed)}
function App(){
 const [initialStorage]=useState(load);
 const [data,setData]=useState(initialStorage.data);
 const [storageWarning,setStorageWarning]=useState(initialStorage.warning);
 const demoReadOnly=initialStorage.readOnly;
 const initialRender=useRef(true);
 const [tab,setTab]=useState("events");
 const [form,setForm]=useState(["","",""]);
 const [filter,setFilter]=useState("");
 const [backupPreview,setBackupPreview]=useState("");
 const [restoreCandidate,setRestoreCandidate]=useState(null);
 const [formError,setFormError]=useState("");
 const [ecocupSettings,setEcocupSettings]=useState(()=>parseDemoEcocupSettings(localStorage.getItem(ECOCUP_DEMO_SETTINGS_KEY)));
 const {openingBalance:ecocupOpening,alertThreshold:ecocupThreshold}=ecocupSettings;
 const setEcocupOpening=value=>setEcocupSettings(old=>({...old,openingBalance:value}));
 const setEcocupThreshold=value=>setEcocupSettings(old=>({...old,alertThreshold:value}));
 let ecocupSummary=null,ecocupError="";
 if(tab==="ecocups"){
  try{
   if(!/^(0|[1-9][0-9]*)$/.test(ecocupOpening)||!/^(0|[1-9][0-9]*)$/.test(ecocupThreshold)) throw new TypeError("Saisissez des nombres entiers positifs.");
   ecocupSummary=summarizeEcocups(data.ecocups||[],{openingBalance:Number(ecocupOpening),alertThreshold:Number(ecocupThreshold)});
  }catch(e){ecocupError=e.message||"Mouvements invalides";}
 }
 useEffect(()=>{if(initialRender.current){initialRender.current=false;return;}if(demoReadOnly)return;const result=writeDemoStorage(localStorage,data);setStorageWarning(result.warning||"")},[data]);
 useEffect(()=>{try{localStorage.setItem(ECOCUP_DEMO_SETTINGS_KEY,serializeDemoEcocupSettings(ecocupSettings))}catch{/* Keep invalid input visible for correction, never overwrite saved valid settings. */}},[ecocupSettings]);
 const current=categories.find(c=>c.key===tab);
 const records=(data[tab]||[]).filter(r=>r.values.join(" ").toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
 function add(e){e.preventDefault();if(demoReadOnly){setFormError("Mode lecture seule : les données locales existantes sont protégées.");return;}if(!form[0].trim())return;const row={id:crypto.randomUUID(),values:form.map(x=>x.trim())};if(tab==="ecocups"){try{if(!/^(0|[1-9][0-9]*)$/.test(ecocupOpening)||!/^(0|[1-9][0-9]*)$/.test(ecocupThreshold))throw new Error("Corrigez le stock initial et le seuil.");summarizeEcocups([...(data.ecocups||[]),row],{openingBalance:Number(ecocupOpening),alertThreshold:Number(ecocupThreshold)});}catch(err){setFormError("Mouvement refusé : "+(err instanceof RangeError?"stock insuffisant ou quantité trop grande.":"type ou quantité invalide. Utilisez entrée/sortie et un entier positif."));return;}}setFormError("");setData(d=>({...d,[tab]:[...(d[tab]||[]),row]}));setForm(["","",""])}
 function remove(id){if(demoReadOnly)return;if(!confirm("Supprimer cette fiche ?"))return;setData(d=>({...d,[tab]:(d[tab]||[]).filter(r=>r.id!==id)}))}
 function exportBackup(){const json=createDemoBackup(data);const url=URL.createObjectURL(new Blob([json],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="festapp-demo-sauvegarde-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function inspectBackup(e){setRestoreCandidate(null);const file=e.target.files?.[0];if(!file)return;try{if(file.size>10_000_000)throw new Error("Fichier trop volumineux");const json=await file.text();const result=inspectDemoBackupReadiness(json);const plan=planDemoRestore(data,json);const missing=result.missingCategories.length?` Catégories absentes : ${result.missingCategories.join(", ")}.`:"";const empty=result.emptyCategories.length?` Catégories vides : ${result.emptyCategories.join(", ")}.`:"";if(plan.safeToAppend && Object.values(plan.counts).some(c=>c.addable>0))setRestoreCandidate({json,sourceSnapshot:JSON.stringify(data)});setBackupPreview(`Sauvegarde de démonstration valide : ${result.recordCount} fiches. ${missing}${empty} ${result.hasContactData?"Coordonnées présentes : fichier à conserver de façon privée.":""} Comparaison locale : ${Object.values(plan.counts).reduce((n,c)=>n+c.addable,0)} fiches nouvelles, ${plan.conflicts.length} identifiants déjà présents, ${plan.capacityExceeded.length} catégories dépassant la limite. ${plan.safeToAppend?"Ajout potentiellement possible après validation manuelle.":"Restauration à examiner avant toute opération."} Aucune donnée importée ni envoyée.`)}catch{setBackupPreview("Sauvegarde invalide ou incompatible. Aucune donnée modifiée.")}finally{e.target.value=""}}
 function restoreBackup(){
  if(demoReadOnly||!restoreCandidate)return;
  if(JSON.stringify(data)!==restoreCandidate.sourceSnapshot){setRestoreCandidate(null);setBackupPreview("Les fiches ont changé depuis la vérification. Rechargez la sauvegarde avant de restaurer.");return;}
  if(!confirm("Ajouter les fiches absentes de cette sauvegarde de démonstration ? Les fiches existantes seront conservées. Téléchargez une sauvegarde avant de continuer."))return;
  try{const restored=applyDemoRestore(data,restoreCandidate.json,{confirmed:true});setData(restored);setBackupPreview("Fiches ajoutées dans cette démonstration locale. Téléchargez une nouvelle sauvegarde JSON.");}
  catch{setBackupPreview("Restauration refusée : conflit ou sauvegarde incompatible. Aucune donnée modifiée.");}
  finally{setRestoreCandidate(null);}
 }
 function exportCsv(){const rows=(data[tab]||[]).map(r=>r.values);const csv=buildCsv(current.fields,rows);const a=document.createElement("a");const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.href=url;a.download="festapp-"+tab+".csv";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 return <main>
 <header><div>🎆 FEST'APP <small>Comité des fêtes de Liernais</small></div><span className="demo">Mode démonstration</span></header>
 {storageWarning&&<p role="alert" className="note">⚠ {storageWarning}</p>}
 <section className="hero"><h1>Organisons nos fêtes !</h1><p>Manifestations, bénévoles, stocks et bilans au même endroit.</p><strong>⚠ Données enregistrées uniquement sur cet appareil, non partagées avec le bureau.</strong></section>
 <section className="panel" aria-label="Sauvegarde de démonstration"><div className="heading"><h2>💾 Sauvegarde locale</h2><button className="secondary" onClick={exportBackup}>Télécharger JSON</button></div><p>Conservez une copie de vos fiches de démonstration. La vérification d’un fichier ne restaure ni ne remplace aucune donnée.</p><label>Vérifier une sauvegarde JSON<input type="file" accept=".json,application/json" onChange={inspectBackup}/></label>{backupPreview&&<p role="status">{backupPreview}</p>}{restoreCandidate&&!demoReadOnly&&<button type="button" onClick={restoreBackup}>Confirmer l’ajout des fiches manquantes</button>}</section>
 <nav aria-label="Modules">{categories.map(c=><button key={c.key} className={tab===c.key?"active":""} onClick={()=>{setTab(c.key);setForm(["","",""]);setFilter("");setFormError("")}}>{c.icon} {c.title}</button>)}</nav>
 <section className="panel"><div className="heading"><h2>{current.icon} {current.title}</h2><button className="secondary" onClick={exportCsv}>Exporter CSV</button></div>
 {tab==="ecocups"&&<div className="note"><p><strong>Calcul local de démonstration uniquement — aucun stock partagé.</strong> Saisir les mouvements exactement sous la forme « entrée » ou « sortie », et une quantité entière positive.</p><div className="fields"><label>Stock initial de démonstration<input inputMode="numeric" value={ecocupOpening} onChange={e=>setEcocupOpening(e.target.value)}/></label><label>Seuil d'alerte<input inputMode="numeric" value={ecocupThreshold} onChange={e=>setEcocupThreshold(e.target.value)}/></label></div>{ecocupError?<p role="alert">⚠ Calcul impossible : {ecocupError}. Vérifiez les mouvements, sans les effacer.</p>:<p role="status"><strong>Solde calculé : {ecocupSummary.balance} écocups.</strong> {ecocupSummary.alert?"⚠ Seuil atteint. Quantité minimale à ajouter : "+(ecocupSummary.minimumToClearAlert??"non calculable")+".":"Stock au-dessus du seuil."}</p>}</div>}
 <form onSubmit={add}>{formError&&<p role="alert">{formError}</p>}<div className="fields">{current.fields.map((label,i)=><label key={label}>{label}<input required={i===0} value={form[i]} onChange={e=>setForm(f=>f.map((v,j)=>i===j?e.target.value:v))} placeholder={label}/></label>)}</div><button type="submit" disabled={demoReadOnly}>+ Ajouter</button></form>
 {tab==="contacts"&&<p className="note">Pour distinguer bénévoles, exposants et groupes, renseignez la catégorie dans chaque fiche (par exemple « bénévole », « exposant » ou « groupe »). L’export CSV concerne uniquement cet appareil.</p>}
 <label className="search">Rechercher<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrer les fiches…"/></label>
 <div className="records">{records.length?records.map(r=><article key={r.id}><div><strong>{r.values[0]}</strong><p>{r.values.slice(1).filter(Boolean).join(" · ")||"Aucune précision"}</p></div><button className="delete" disabled={demoReadOnly} onClick={()=>remove(r.id)} aria-label={"Supprimer "+r.values[0]}>Supprimer</button></article>):<p>Aucune fiche pour le moment.</p>}</div>
 </section><footer>Prototype local • aucune donnée synchronisée</footer>
 </main>
}
createRoot(document.getElementById("root")).render(<App/>);
