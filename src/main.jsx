import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";
import {buildCsv} from "./lib/csv.js";
import {eventOverview} from "./lib/eventOverview.js";
import {scaleRecipeText} from "./lib/recipeText.js";
import {TILL_PRODUCTS,calculateTill,changeQuantity,productsForEvent} from "./lib/quickTill.js";
import {loadTillConfig,eventTillProducts,saveTillConfig,exportTillConfig,importTillConfig} from "./lib/tillConfig.js";
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
 const [contactType,setContactType]=useState("tous");
 const [editingId,setEditingId]=useState(null);
 const [recipeServings,setRecipeServings]=useState("10");
 const [recipeTarget,setRecipeTarget]=useState("50");
 const [recipeOutput,setRecipeOutput]=useState("");
 const [overviewEvent,setOverviewEvent]=useState("Marché de Noël");
 const [recordEventId,setRecordEventId]=useState("");
 const eventOptions=(data.events||[]).filter(r=>r?.id&&r?.values?.[0]);
 const [tillCart,setTillCart]=useState({});
 const [tillEvent,setTillEvent]=useState("Marché de Noël");
 const [initialTillConfig]=useState(()=>loadTillConfig(localStorage));
 const [tillConfig,setTillConfig]=useState(initialTillConfig.config);
 const [tillConfigWarning,setTillConfigWarning]=useState(initialTillConfig.warning);
 const [tillEdit,setTillEdit]=useState(false);
 const tillImportRef=useRef(null);
 const [tillDraft,setTillDraft]=useState([]);
 const tillProducts=eventTillProducts(tillEvent,tillConfig);
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
 const records=(data[tab]||[]).filter(r=>r.values.join(" ").toLocaleLowerCase().includes(filter.toLocaleLowerCase())&&(tab!=="contacts"||contactType==="tous"||r.values[1].trim().toLocaleLowerCase()===contactType));
 function add(e){e.preventDefault();if(demoReadOnly){setFormError("Mode lecture seule : les données locales existantes sont protégées.");return;}if(!form[0].trim())return;const row={id:editingId||crypto.randomUUID(),values:form.map(x=>x.trim()),...(tab!=="events"&&recordEventId?{eventId:recordEventId}:{})};if(tab==="ecocups"){try{if(!/^(0|[1-9][0-9]*)$/.test(ecocupOpening)||!/^(0|[1-9][0-9]*)$/.test(ecocupThreshold))throw new Error("Corrigez le stock initial et le seuil.");summarizeEcocups([...(data.ecocups||[]).filter(r=>r.id!==editingId),row],{openingBalance:Number(ecocupOpening),alertThreshold:Number(ecocupThreshold)});}catch(err){setFormError("Mouvement refusé : "+(err instanceof RangeError?"stock insuffisant ou quantité trop grande.":"type ou quantité invalide. Utilisez entrée/sortie et un entier positif."));return;}}setFormError("");setData(d=>({...d,[tab]:editingId?(d[tab]||[]).map(existing=>existing.id===editingId?{...existing,values:row.values,...(tab!=="events"?{eventId:recordEventId}:{} )}:existing):[...(d[tab]||[]),row]}));setEditingId(null);setForm(["","",""]);setRecordEventId("")}
 function beginEdit(record){if(demoReadOnly)return;setEditingId(record.id);setForm([...record.values]);setRecordEventId(record.eventId||"");setFormError("");window.scrollTo({top:0,behavior:"smooth"});}
 function cancelEdit(){setEditingId(null);setForm(["","",""]);setRecordEventId("");setFormError("");}
 function remove(id){if(demoReadOnly)return;if(!confirm("Supprimer cette fiche ?"))return;if(editingId===id)cancelEdit();setData(d=>({...d,[tab]:(d[tab]||[]).filter(r=>r.id!==id)}))}
 function exportMenus(){const blob=new Blob([exportTillConfig(tillConfig)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="festapp-menus-caisse.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function importMenus(e){const file=e.target.files?.[0];e.target.value="";if(!file)return;try{if(file.size>100000)throw new Error("Fichier trop volumineux");const parsed=importTillConfig(await file.text());if(!window.confirm("Remplacer les menus personnalisés de cet appareil ?"))return;saveTillConfig(localStorage,parsed);setTillConfig(parsed);setTillCart({});setTillEdit(false);setTillConfigWarning("Menus importés sur cet appareil uniquement.")}catch(err){setTillConfigWarning("⚠ Import refusé : "+err.message)}}
 function openTillEditor(){setTillDraft(TILL_PRODUCTS.map(p=>({id:p.id,enabled:tillProducts.some(x=>x.id===p.id),price:String((tillProducts.find(x=>x.id===p.id)||p).priceCents/100).replace(".",",")})));setTillEdit(true)}
 function saveTillEditor(){try{if(initialTillConfig.warning)throw new Error("Réglages locaux illisibles");const chosen=tillDraft.filter(p=>p.enabled).map(p=>{const price=p.price.trim();if(!/^(0|[1-9]\\d*)(?:[,.]\\d{1,2})?$/.test(price))throw new Error("Prix invalide : "+p.id);const cents=Math.round(Number(price.replace(",","."))*100);if(!Number.isSafeInteger(cents)||cents>100000)throw new Error("Prix hors limite");return {id:p.id,priceCents:cents}});const next={...tillConfig,[tillEvent]:chosen};saveTillConfig(localStorage,next);setTillConfig(next);setTillCart({});setTillEdit(false);setTillConfigWarning("Menu enregistré uniquement sur cet appareil.")}catch(e){setTillConfigWarning("⚠ "+e.message)}}
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
 <section className="panel" aria-label="Préparation de manifestation"><div className="heading"><h2>🎉 Préparation de manifestation</h2><span className="demo">Aperçu local</span></div><label>Choisir une manifestation<select value={overviewEvent} onChange={e=>setOverviewEvent(e.target.value)}>{eventNames.map(name=><option key={name} value={name}>{name}</option>)}</select></label><p>Seules les fiches contenant exactement le nom de la manifestation dans un champ sont comptées. Les autres restent non attribuées : aucun rapprochement automatique risqué.</p><div className="till-grid">{[["tasks","✅ Tâches"],["shopping","🛒 Achats"],["stock","📦 Stock"],["shifts","🕒 Bénévoles"],["feedback","📝 Retours"],["finance","📊 Finances"]].map(([key,label])=><button type="button" className="till-product" key={key} onClick={()=>{setTab(key);setFilter("");setEditingId(null);setRecordEventId(eventOptions.find(r=>r.values[0]===overviewEvent)?.id||"");setForm(["","",""]);setFormError("")}}><strong>{label}</strong><span>{eventOverview(data,overviewEvent,eventOptions.find(r=>r.values[0]===overviewEvent)?.id||null).counts[key]} fiche(s) liée(s)</span><span>Ouvrir le module</span></button>)}</div><p className="note">Aperçu de démonstration uniquement : les fiches non attribuées ne sont pas modifiées.</p></section>
 <section className="panel" aria-label="Caisse tactile"><label>Manifestation<select value={tillEvent} onChange={e=>{setTillEvent(e.target.value);setTillCart({});setTillEdit(false)}}>{eventNames.map(name=><option key={name} value={name}>{name}</option>)}</select></label><div className="heading"><h2>🧾 Caisse rapide</h2><span className="demo">Essai sans paiement</span></div><p>Tarifs fictifs à remplacer avant utilisation. Panier propre à ce téléphone, non synchronisé. Aucun encaissement SumUp déclenché.</p><button type="button" className="secondary" onClick={()=>tillEdit?setTillEdit(false):openTillEditor()}>{tillEdit?"Fermer les réglages":"⚙ Personnaliser produits et tarifs"}</button>{tillConfigWarning&&<p role="status">{tillConfigWarning}</p>}{tillEdit&&<div className="note"><h3>Produits de cette manifestation</h3>{tillDraft.map((p,i)=><div key={p.id} className="fields"><label><input type="checkbox" checked={p.enabled} onChange={e=>setTillDraft(old=>old.map((x,j)=>j===i?{...x,enabled:e.target.checked}:x))}/> {TILL_PRODUCTS.find(x=>x.id===p.id).name}</label><label>Prix (€)<input inputMode="decimal" value={p.price} onChange={e=>setTillDraft(old=>old.map((x,j)=>j===i?{...x,price:e.target.value}:x))}/></label></div>)}<button type="button" disabled={!!initialTillConfig.warning} onClick={saveTillEditor}>Enregistrer ce menu</button></div>}<div className="till-actions"><button type="button" className="secondary" onClick={exportMenus}>Exporter les menus</button><button type="button" className="secondary" onClick={()=>tillImportRef.current?.click()}>Importer les menus</button><input type="file" ref={tillImportRef} accept=".json,application/json" style={{display:"none"}} onChange={importMenus}/></div><div className="till-grid">{tillProducts.map(p=><button type="button" className="till-product" key={p.id} onClick={()=>setTillCart(c=>changeQuantity(c,p.id,1,tillProducts))}><span className="till-icon">{p.icon}</span><strong>{p.name}</strong><span>{(p.priceCents/100).toFixed(2).replace(".",",")} €</span><span>× {tillCart[p.id]||0}</span></button>)}</div><div className="heading"><strong>Total : {(calculateTill(tillCart,tillProducts)/100).toFixed(2).replace(".",",")} €</strong><button className="secondary" type="button" onClick={()=>setTillCart({})}>Vider le panier</button></div><div className="till-actions">{TILL_PRODUCTS.filter(p=>tillCart[p.id]>0).map(p=><button type="button" className="secondary" key={p.id} onClick={()=>setTillCart(c=>changeQuantity(c,p.id,-1,tillProducts))}>− 1 {p.name}</button>)}</div><p className="note">Paiement par carte et espèces : non activé. Ne pas utiliser comme caisse réelle tant que les tarifs, la sauvegarde et le rapprochement SumUp ne sont pas validés.</p></section>
 <nav aria-label="Modules">{categories.map(c=><button key={c.key} className={tab===c.key?"active":""} onClick={()=>{setTab(c.key);setRecipeOutput("");setContactType("tous");setEditingId(null);setRecordEventId("");setForm(["","",""]);setFilter("");setFormError("")}}>{c.icon} {c.title}</button>)}</nav>
 <section className="panel"><div className="heading"><h2>{current.icon} {current.title}</h2><button className="secondary" onClick={exportCsv}>Exporter CSV</button></div>
 {tab==="ecocups"&&<div className="note"><p><strong>Calcul local de démonstration uniquement — aucun stock partagé.</strong> Saisir les mouvements exactement sous la forme « entrée » ou « sortie », et une quantité entière positive.</p><div className="fields"><label>Stock initial de démonstration<input inputMode="numeric" value={ecocupOpening} onChange={e=>setEcocupOpening(e.target.value)}/></label><label>Seuil d'alerte<input inputMode="numeric" value={ecocupThreshold} onChange={e=>setEcocupThreshold(e.target.value)}/></label></div>{ecocupError?<p role="alert">⚠ Calcul impossible : {ecocupError}. Vérifiez les mouvements, sans les effacer.</p>:<p role="status"><strong>Solde calculé : {ecocupSummary.balance} écocups.</strong> {ecocupSummary.alert?"⚠ Seuil atteint. Quantité minimale à ajouter : "+(ecocupSummary.minimumToClearAlert??"non calculable")+".":"Stock au-dessus du seuil."}</p>}</div>}
 {tab==="recipes"&&<div className="note"><h3>🧮 Calculateur de quantités</h3><p>Choisissez une recette ci-dessous avec « Modifier », puis indiquez ses ingrédients, un par ligne (ex. : 250 g farine). Le calcul ne modifie pas la recette enregistrée.</p><div className="fields"><label>Recette prévue pour<input inputMode="numeric" value={recipeServings} onChange={e=>setRecipeServings(e.target.value)}/></label><label>Nombre de personnes souhaité<input inputMode="numeric" value={recipeTarget} onChange={e=>setRecipeTarget(e.target.value)}/></label></div><button type="button" onClick={()=>{try{setRecipeOutput(scaleRecipeText(form[1],Number(recipeServings),Number(recipeTarget)))}catch(e){setRecipeOutput("⚠ "+e.message)}}}>Calculer les ingrédients</button>{recipeOutput&&<pre role="status" style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{recipeOutput}</pre>}</div>}
 <form onSubmit={add}>{tab!=="events"&&tab!=="contacts"&&tab!=="ecocups"&&<label>Manifestation associée<select value={recordEventId} onChange={e=>setRecordEventId(e.target.value)}><option value="">Non attribuée</option>{eventOptions.map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label>}{formError&&<p role="alert">{formError}</p>}<div className="fields">{current.fields.map((label,i)=><label key={label}>{label}<input required={i===0} value={form[i]} onChange={e=>setForm(f=>f.map((v,j)=>i===j?e.target.value:v))} placeholder={label}/></label>)}</div><button type="submit" disabled={demoReadOnly}>{editingId?"Enregistrer les modifications":"+ Ajouter"}</button>{editingId&&<button type="button" className="secondary" onClick={cancelEdit}>Annuler la modification</button>}</form>
 {tab==="contacts"&&<div className="note"><p>Retrouvez rapidement les bénévoles, exposants et groupes. L’export CSV concerne uniquement cet appareil.</p><div className="fields"><label>Afficher les contacts<select value={contactType} onChange={e=>setContactType(e.target.value)}><option value="tous">Tous les contacts</option><option value="bénévole">Bénévoles</option><option value="exposant">Exposants</option><option value="groupe">Groupes</option></select></label></div><p>{records.length} fiche(s) affichée(s).</p></div>}
 <label className="search">Rechercher<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrer les fiches…"/></label>
 <div className="records">{records.length?records.map(r=><article key={r.id}><div><strong>{r.values[0]}</strong><p>{r.values.slice(1).filter(Boolean).join(" · ")||"Aucune précision"}</p></div><button className="secondary" disabled={demoReadOnly} onClick={()=>beginEdit(r)}>Modifier</button><button className="delete" disabled={demoReadOnly} onClick={()=>remove(r.id)} aria-label={"Supprimer "+r.values[0]}>Supprimer</button></article>):<p>Aucune fiche pour le moment.</p>}</div>
 </section><footer>Prototype local • aucune donnée synchronisée</footer>
 </main>
}
createRoot(document.getElementById("root")).render(<App/>);
