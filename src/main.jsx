import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";
import SharedAccess from "./SharedAccess.jsx";
import {buildCsv} from "./lib/csv.js";
import {CONTACT_EXPORT_COLUMNS,selectContactsWithDetailsForExport} from "./lib/contactExport.js";
import {validateContactDetails} from "./lib/contactDetails.js";
import {eventOverview} from "./lib/eventOverview.js";
import {suggestChecklistTasks,suggestDriveChecklistTasks,DRIVE_CHECKLISTS} from "./lib/eventChecklist.js";
import {checklistProgress} from "./lib/checklistProgress.js";
import {planNextEdition} from "./lib/eventEdition.js";
import {suggestEventPurchases} from "./lib/eventPurchases.js";
import {compareShoppingWithStock,summarizeStockComparison} from "./lib/stockComparison.js";
import {findVolunteerConflicts,parseShiftSlot} from "./lib/volunteerPlanning.js";
import {volunteerSchedule} from "./lib/volunteerSchedule.js";
import {volunteerChoices} from "./lib/volunteerDirectory.js";
import {volunteerPostSummary} from "./lib/volunteerPostSummary.js";
import {VOLUNTEER_NEEDS_KEY,staffingStatus} from "./lib/volunteerNeeds.js";
import {readDemoEcocupSettings,readDemoVolunteerNeeds} from "./lib/demoAuxStorage.js";
import {exportVolunteerNeeds,importVolunteerNeeds} from "./lib/volunteerNeedsBackup.js";
import {scaleRecipeText} from "./lib/recipeText.js";
import {TILL_PRODUCTS,calculateTill,changeQuantity,productsForEvent} from "./lib/quickTill.js";
import {loadTillConfig,eventTillProducts,saveTillConfig,exportTillConfig,importTillConfig} from "./lib/tillConfig.js";
import {summarizeEcocups} from "./lib/ecocupDemoBalance.js";
import {ECOCUP_DEMO_SETTINGS_KEY,serializeDemoEcocupSettings} from "./lib/ecocupDemoSettings.js";
import {createCombinedDemoBackup,inspectCombinedEcocupSettings,inspectCombinedVolunteerNeeds,mergeMissingVolunteerNeeds} from "./lib/combinedDemoBackup.js";
import {readDemoStorage,writeDemoStorage} from "./lib/demoStorage.js";
import {inspectDemoBackupReadiness} from "./lib/demoBackupReadiness.js";
import {planDemoRestore} from "./lib/demoRestorePlan.js";
import {previewRestoreImpact} from "./lib/restorePreview.js";
import {applyDemoRestore} from "./lib/applyDemoRestore.js";

const categories=[
{key:"events",title:"Manifestations",icon:"🎉",fields:["Nom","Date","Lieu"]},
{key:"tasks",title:"Tâches",icon:"✅",fields:["Tâche","Responsable","Échéance"]},
{key:"shopping",title:"Achats",icon:"🛒",fields:["Article","Quantité","État"]},
{key:"stock",title:"Stock",icon:"📦",fields:["Article","Quantité","Seuil d'alerte"]},
{key:"ecocups",title:"Écocups",icon:"🥤",fields:["Mouvement","Quantité","Manifestation"]},
{key:"contacts",title:"Annuaire",icon:"👥",fields:["Nom","Catégorie","Contact libre (ancienne fiche / note)"]},
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
 const [initialNeedsStorage]=useState(()=>readDemoVolunteerNeeds(localStorage));
 const [initialEcocupStorage]=useState(()=>readDemoEcocupSettings(localStorage));
 const [data,setData]=useState(initialStorage.data);
 const [storageWarning,setStorageWarning]=useState(initialStorage.warning);
 const demoReadOnly=initialStorage.readOnly||initialNeedsStorage.readOnly||initialEcocupStorage.readOnly;
 const initialRender=useRef(true);
 const [tab,setTab]=useState("events");
 const [form,setForm]=useState(["","",""]);
 const [contactEmail,setContactEmail]=useState("");
 const [contactPhone,setContactPhone]=useState("");
 const [filter,setFilter]=useState("");
 const [contactType,setContactType]=useState("tous");
 const [editingId,setEditingId]=useState(null);
 const modulePanelRef=useRef(null);
 const [recipeServings,setRecipeServings]=useState("10");
 const [recipeTarget,setRecipeTarget]=useState("50");
 const [recipeOutput,setRecipeOutput]=useState("");
 const [selectedRecipeId,setSelectedRecipeId]=useState("");
 const [overviewEvent,setOverviewEvent]=useState("Marché de Noël");
 const [checklistStatus,setChecklistStatus]=useState("");
 const [nextEditionYear,setNextEditionYear]=useState(String(new Date().getFullYear()+1));
 const [recordEventId,setRecordEventId]=useState("");
 const [volunteerNeeds,setVolunteerNeeds]=useState(initialNeedsStorage.needs);
 const [needsWarning,setNeedsWarning]=useState("");
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
 const [ecocupSettings,setEcocupSettings]=useState(initialEcocupStorage.settings);
 const {openingBalance:ecocupOpening,alertThreshold:ecocupThreshold}=ecocupSettings;
 const setEcocupOpening=value=>setEcocupSettings(old=>({...old,openingBalance:value}));
 const setEcocupThreshold=value=>setEcocupSettings(old=>({...old,alertThreshold:value}));
 let ecocupSummary=null,ecocupError="";
 try{
  if(!/^(0|[1-9][0-9]*)$/.test(ecocupOpening)||!/^(0|[1-9][0-9]*)$/.test(ecocupThreshold)) throw new TypeError("Saisissez des nombres entiers positifs.");
  ecocupSummary=summarizeEcocups(data.ecocups||[],{openingBalance:Number(ecocupOpening),alertThreshold:Number(ecocupThreshold)});
 }catch(e){ecocupError=e.message||"Mouvements invalides";}
 useEffect(()=>{if(initialRender.current){initialRender.current=false;return;}if(demoReadOnly)return;const result=writeDemoStorage(localStorage,data);setStorageWarning(result.warning||"")},[data]);
 useEffect(()=>{if(demoReadOnly)return;try{localStorage.setItem(ECOCUP_DEMO_SETTINGS_KEY,serializeDemoEcocupSettings(ecocupSettings))}catch{/* Keep invalid input visible for correction, never overwrite saved valid settings. */}},[ecocupSettings]);
 useEffect(()=>{if(demoReadOnly)return;try{localStorage.setItem(VOLUNTEER_NEEDS_KEY,JSON.stringify(volunteerNeeds));setNeedsWarning("");}catch{setNeedsWarning("Impossible de sauvegarder les besoins sur cet appareil.");}},[volunteerNeeds]);
 const selectedOverview=eventOverview(data,overviewEvent,eventOptions.find(r=>r.values[0]===overviewEvent)?.id||null);
 const checklistTemplateName=overviewEvent.replace(/\s+20\d{2}$/,"");
 const volunteers=volunteerChoices(data.contacts||[]);
 const volunteerPosts=["🍹 Bar","🍳 Cuisine","👋 Accueil","🧹 Installation","🎟️ Entrées","📦 Logistique"];
 const printEvent=eventOptions.find(r=>r.id===recordEventId);
 const printSchedule=printEvent?volunteerSchedule(data.shifts||[],printEvent.id):null;
 const current=categories.find(c=>c.key===tab);
 const normalizeContact=value=>String(value??"").trim().normalize("NFC").toLocaleLowerCase("fr");
 const records=(data[tab]||[]).filter(r=>tab==="contacts"
  ?(contactType==="tous"||normalizeContact(r.values[1])===normalizeContact(contactType))&&[...r.values,r.email||"",r.phone||""].some(value=>normalizeContact(value).includes(normalizeContact(filter)))
  :r.values.join(" ").toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
 function add(e){
  e.preventDefault();
  if(demoReadOnly){setFormError("Mode lecture seule : les données locales existantes sont protégées.");return;}
  if(!form[0].trim())return;
  let details={};
  if(tab==="contacts"){
   if(!form[1].trim()){setFormError("Choisissez une catégorie pour ce contact.");return;}
   try{details=validateContactDetails(contactEmail,contactPhone)}
   catch(err){setFormError(err.message);return;}
  }
  const row={id:editingId||crypto.randomUUID(),values:form.map(x=>x.trim()),...(tab!=="events"&&recordEventId?{eventId:recordEventId}:{}),...details};
  if(tab==="shifts"&&form[1].trim()){
   if(!parseShiftSlot(form[1])){setFormError("Créneau invalide : utilisez HH:MM-HH:MM, par exemple 10:00-12:30.");return;}
   const clashes=findVolunteerConflicts(data.shifts||[],row,{excludeId:editingId});
   if(clashes.length){setFormError("Ce bénévole a déjà un créneau qui se chevauche sur cette manifestation. Corrigez les horaires avant d’enregistrer.");return;}
  }
  if(tab==="ecocups"){
   try{
    if(!/^(0|[1-9][0-9]*)$/.test(ecocupOpening)||!/^(0|[1-9][0-9]*)$/.test(ecocupThreshold))throw new Error("Corrigez le stock initial et le seuil.");
    summarizeEcocups([...(data.ecocups||[]).filter(r=>r.id!==editingId),row],{openingBalance:Number(ecocupOpening),alertThreshold:Number(ecocupThreshold)});
   }catch(err){setFormError("Mouvement refusé : "+(err instanceof RangeError?"stock insuffisant ou quantité trop grande.":"type ou quantité invalide. Utilisez entrée/sortie et un entier positif."));return;}
  }
  setFormError("");
  setData(d=>({...d,[tab]:editingId?(d[tab]||[]).map(existing=>existing.id===editingId?{...existing,values:row.values,...(tab!=="events"?{eventId:recordEventId}:{}),...(tab==="contacts"?details:{})}:existing):[...(d[tab]||[]),row]}));
  setEditingId(null);setForm(["","",""]);setRecordEventId("");setContactEmail("");setContactPhone("");
 }
 function beginEdit(record){if(demoReadOnly)return;setEditingId(record.id);setForm([...record.values]);setContactEmail(record.email||"");setContactPhone(record.phone||"");setRecordEventId(record.eventId||"");setFormError("");window.scrollTo({top:0,behavior:"smooth"});}
 function cancelEdit(){setEditingId(null);setForm(["","",""]);setContactEmail("");setContactPhone("");setRecordEventId("");setFormError("");}
 function openModule(key,eventId=""){
  setTab(key);setRecipeOutput("");setContactType("tous");setEditingId(null);
  setRecordEventId(eventId);setForm(["","",""]);setContactEmail("");setContactPhone("");
  setFilter("");setFormError("");
  window.requestAnimationFrame(()=>{
   modulePanelRef.current?.focus({preventScroll:true});
   modulePanelRef.current?.scrollIntoView({behavior:"smooth",block:"start"});
  });
 }
 function remove(id){if(demoReadOnly)return;if(!confirm("Supprimer cette fiche ?"))return;if(editingId===id)cancelEdit();setData(d=>({...d,[tab]:(d[tab]||[]).filter(r=>r.id!==id)}))}
 function toggleTaskDone(id){if(demoReadOnly)return;setData(d=>({...d,tasks:(d.tasks||[]).map(r=>r.id===id?{...r,done:!r.done}:r)}));}
 function downloadVolunteerNeeds(){const blob=new Blob([exportVolunteerNeeds(volunteerNeeds)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="festapp-besoins-benevoles.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function uploadVolunteerNeeds(e){const file=e.target.files?.[0];e.target.value="";if(!file)return;try{if(demoReadOnly)throw new Error("Mode lecture seule.");if(file.size>1_000_000)throw new Error("Fichier trop volumineux.");const parsed=importVolunteerNeeds(await file.text());if(!window.confirm("Remplacer les besoins bénévoles enregistrés sur cet appareil ? Les affectations existantes ne seront pas modifiées."))return;localStorage.setItem(VOLUNTEER_NEEDS_KEY,JSON.stringify(parsed));setVolunteerNeeds(parsed);setNeedsWarning("Besoins importés sur cet appareil.");}catch(err){setNeedsWarning("⚠ Import refusé : "+err.message);}}
 function exportMenus(){const blob=new Blob([exportTillConfig(tillConfig)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="festapp-menus-caisse.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function importMenus(e){const file=e.target.files?.[0];e.target.value="";if(!file)return;try{if(file.size>100000)throw new Error("Fichier trop volumineux");const parsed=importTillConfig(await file.text());if(!window.confirm("Remplacer les menus personnalisés de cet appareil ?"))return;saveTillConfig(localStorage,parsed);setTillConfig(parsed);setTillCart({});setTillEdit(false);setTillConfigWarning("Menus importés sur cet appareil uniquement.")}catch(err){setTillConfigWarning("⚠ Import refusé : "+err.message)}}
 function openTillEditor(){setTillDraft(TILL_PRODUCTS.map(p=>({id:p.id,enabled:tillProducts.some(x=>x.id===p.id),price:String((tillProducts.find(x=>x.id===p.id)||p).priceCents/100).replace(".",",")})));setTillEdit(true)}
 function saveTillEditor(){try{if(initialTillConfig.warning)throw new Error("Réglages locaux illisibles");const chosen=tillDraft.filter(p=>p.enabled).map(p=>{const price=p.price.trim();if(!/^(0|[1-9]\\d*)(?:[,.]\\d{1,2})?$/.test(price))throw new Error("Prix invalide : "+p.id);const cents=Math.round(Number(price.replace(",","."))*100);if(!Number.isSafeInteger(cents)||cents>100000)throw new Error("Prix hors limite");return {id:p.id,priceCents:cents}});const next={...tillConfig,[tillEvent]:chosen};saveTillConfig(localStorage,next);setTillConfig(next);setTillCart({});setTillEdit(false);setTillConfigWarning("Menu enregistré uniquement sur cet appareil.")}catch(e){setTillConfigWarning("⚠ "+e.message)}}
 function exportBackup(){if(demoReadOnly){setBackupPreview("⚠ Sauvegarde bloquée : une partie des données locales est illisible. Ne supprimez pas les données de cet appareil.");return;}try{const json=createCombinedDemoBackup(data,volunteerNeeds,undefined,ecocupSettings);const url=URL.createObjectURL(new Blob([json],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="festapp-demo-sauvegarde-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch{setBackupPreview("⚠ Téléchargement impossible : la sauvegarde est trop volumineuse ou contient des données invalides. Aucune fiche n’a été effacée.")}}
 async function inspectBackup(e){
  setRestoreCandidate(null);
  const file=e.target.files?.[0];
  if(!file)return;
  try{
   if(file.size>10_000_000)throw new Error("Fichier trop volumineux");
   const json=await file.text();
   const result=inspectDemoBackupReadiness(json);
   const plan=planDemoRestore(data,json);
   const impact=previewRestoreImpact(json,data);
   const includedNeeds=inspectCombinedVolunteerNeeds(json);
   const includedEcocups=inspectCombinedEcocupSettings(json);
   const missing=result.missingCategories.length?` Catégories absentes : ${result.missingCategories.join(", ")}.`:"";
   const empty=result.emptyCategories.length?` Catégories vides : ${result.emptyCategories.join(", ")}.`:"";
   const hasEcocupAdditions=Boolean(plan.additions.ecocups?.length);
   let ecocupSafe=true;
   if(hasEcocupAdditions){
    try{summarizeEcocups([...(data.ecocups||[]),...plan.additions.ecocups],{openingBalance:Number(ecocupOpening),alertThreshold:Number(ecocupThreshold)});}
    catch{ecocupSafe=false;}
   }
   if(plan.safeToAppend && ecocupSafe && (Object.values(plan.counts).some(c=>c.addable>0)||(includedNeeds.present&&JSON.stringify(mergeMissingVolunteerNeeds(volunteerNeeds,includedNeeds.needs))!==JSON.stringify(volunteerNeeds)))){
    setRestoreCandidate({json,sourceSnapshot:JSON.stringify(data),needsSnapshot:JSON.stringify(volunteerNeeds),settingsSnapshot:JSON.stringify(ecocupSettings),hasEcocupAdditions});
   }
   const savedSettings=includedEcocups.present
    ?` Réglages écocups du fichier : stock initial ${includedEcocups.settings.openingBalance}, seuil d’alerte ${includedEcocups.settings.alertThreshold}. Ils ne sont pas appliqués automatiquement : ressaisissez-les dans l’onglet Écocups et vérifiez le solde avant l’import.`
    :" Réglages écocups non présents dans ce fichier ancien : vérifiez manuellement le stock initial et le seuil.";
   const ecocupWarning=ecocupSafe?"":" ⚠ Ajout écocups bloqué : mouvements incompatibles avec le stock initial et le seuil de cet appareil. Vérifiez les réglages sans effacer les mouvements.";
   setBackupPreview(`Sauvegarde de démonstration valide : ${result.recordCount} fiches. ${missing}${empty} ${result.hasContactData?"Coordonnées présentes : fichier à conserver de façon privée.":""} Comparaison locale : ${Object.values(plan.counts).reduce((n,c)=>n+c.addable,0)} fiches nouvelles, ${plan.conflicts.length} identifiants déjà présents, ${plan.capacityExceeded.length} catégories dépassant la limite, ${plan.danglingLinks.length} lien(s) vers des manifestations absentes. Prévisualisation d’un éventuel remplacement complet (non proposé ici) : ${impact.categories.reduce((n,c)=>n+c.wouldRemove,0)} fiche(s) locale(s) absente(s) du fichier, ${impact.categories.reduce((n,c)=>n+c.matchingIds,0)} identifiant(s) commun(s), ${impact.existingCategoriesNotInBackup.length} catégorie(s) locale(s) non incluse(s) dans la sauvegarde. La restauration disponible ajoute uniquement les fiches manquantes, sans effacer ni remplacer les fiches existantes. ${plan.safeToAppend&&ecocupSafe?"Ajout potentiellement possible après validation manuelle.":"Restauration bloquée : vérifiez les identifiants, limites et liens de manifestation avant toute opération."} ${includedNeeds.present?" Besoins bénévoles inclus dans le fichier.":""}${savedSettings}${ecocupWarning} Aucune donnée importée ni envoyée.`);
  }catch{setBackupPreview("Sauvegarde invalide ou incompatible. Aucune donnée modifiée.")}
  finally{e.target.value=""}
 }
 function restoreBackup(){
  if(demoReadOnly||!restoreCandidate)return;
  if(JSON.stringify(data)!==restoreCandidate.sourceSnapshot||JSON.stringify(volunteerNeeds)!==restoreCandidate.needsSnapshot||JSON.stringify(ecocupSettings)!==restoreCandidate.settingsSnapshot){setRestoreCandidate(null);setBackupPreview("Les fiches ou les réglages écocups ont changé depuis la vérification. Rechargez la sauvegarde avant de restaurer.");return;}
  if(!confirm("Ajouter les fiches absentes de cette sauvegarde de démonstration ? Les fiches existantes seront conservées. Téléchargez une sauvegarde avant de continuer."))return;
  try{const restored=applyDemoRestore(data,restoreCandidate.json,{confirmed:true});if(restoreCandidate.hasEcocupAdditions)summarizeEcocups(restored.ecocups||[],{openingBalance:Number(ecocupOpening),alertThreshold:Number(ecocupThreshold)});const includedNeeds=inspectCombinedVolunteerNeeds(restoreCandidate.json);if(includedNeeds.present){const merged=mergeMissingVolunteerNeeds(volunteerNeeds,includedNeeds.needs);localStorage.setItem(VOLUNTEER_NEEDS_KEY,JSON.stringify(merged));setVolunteerNeeds(merged);}setData(restored);setBackupPreview("Fiches ajoutées dans cette démonstration locale. Vérifiez le stock et le seuil des écocups, puis téléchargez une nouvelle sauvegarde JSON.");}
  catch{setBackupPreview("Restauration refusée : conflit ou sauvegarde incompatible. Aucune donnée modifiée.");}
  finally{setRestoreCandidate(null);}
 }
 function exportCsv(filteredContacts=false){
  const rows=tab==="contacts"
   ?selectContactsWithDetailsForExport(data.contacts||[],filteredContacts?contactType:"tous",filteredContacts?filter:"")
   :(data[tab]||[]).map(r=>r.values);
  const csv=tab==="contacts"?buildCsv(CONTACT_EXPORT_COLUMNS,rows):buildCsv(current.fields,rows);
  const a=document.createElement("a");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.href=url;
  a.download="festapp-"+tab+(filteredContacts&&tab==="contacts"?"-"+(contactType==="tous"?"selection":contactType):"")+".csv";
  a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 return <main>
 <header><div>🎆 FEST'APP <small>Comité des fêtes de Liernais</small></div><span className="demo">Mode démonstration</span></header>
 {storageWarning&&<p role="alert" className="note">⚠ {storageWarning}</p>}
 {initialNeedsStorage.warning&&<p role="alert" className="note">⚠ {initialNeedsStorage.warning}</p>}
 {initialEcocupStorage.warning&&<p role="alert" className="note">⚠ {initialEcocupStorage.warning}</p>}
 <section className="hero"><h1>Organisons nos fêtes !</h1><p>Manifestations, bénévoles, stocks et bilans au même endroit.</p><strong>⚠ Données enregistrées uniquement sur cet appareil, non partagées avec le bureau.</strong></section>
 <section className="quick-access" aria-label="Accès rapide aux modules">
  <div className="quick-access-title"><h2>⚡ Accès rapide</h2><span>Choisissez votre activité</span></div>
  <div className="quick-access-grid">
   {[
    ["events","🎉","Manifestations",(data.events||[]).length+" fiches"],
    ["tasks","✅","Tâches",(data.tasks||[]).filter(r=>r.done!==true).length+" à faire"],
    ["contacts","👥","Annuaire",(data.contacts||[]).length+" contacts"],
    ["ecocups","🥤","Écocups",ecocupSummary?(ecocupSummary.alert?"⚠ Seuil atteint · ":"Stock · ")+ecocupSummary.balance:"Stock à vérifier"],
    ["shifts","🕒","Bénévoles",(data.shifts||[]).length+" affectations"],
    ["recipes","🍲","Recettes",(data.recipes||[]).length+" recettes"]
   ].map(([key,icon,title,details])=><button type="button" key={key} className="quick-access-tile" aria-label={title+" : "+details} onClick={()=>openModule(key)}><span className="quick-icon" aria-hidden="true">{icon}</span><strong>{title}</strong><small>{details}</small></button>)}
  </div>
  <p className="quick-access-note">Chiffres de démonstration de cet appareil uniquement · aucun stock partagé.</p>
 </section>
 <SharedAccess/>
 <section className="panel" aria-label="Sauvegarde de démonstration"><div className="heading"><h2>💾 Sauvegarde locale</h2><button className="secondary" onClick={exportBackup}>Télécharger JSON</button></div><p>Conservez une copie de vos fiches de démonstration. La vérification d’un fichier ne restaure ni ne remplace aucune donnée.</p><label>Vérifier une sauvegarde JSON<input type="file" accept=".json,application/json" onChange={inspectBackup}/></label>{backupPreview&&<p role="status">{backupPreview}</p>}{restoreCandidate&&!demoReadOnly&&<button type="button" onClick={restoreBackup}>Confirmer l’ajout des fiches manquantes</button>}</section>
 <section className="panel" aria-label="Préparation de manifestation"><div className="heading"><h2>🎉 Préparation de manifestation</h2><span className="demo">Aperçu local</span></div><label>Choisir une manifestation<select value={overviewEvent} onChange={e=>{setOverviewEvent(e.target.value);setChecklistStatus("");}}>{[...new Set([...eventNames,...eventOptions.map(r=>r.values[0])])].map(name=><option key={name} value={name}>{name}</option>)}</select></label><p>Les fiches liées explicitement à cette manifestation sont prioritaires. Les anciennes fiches sans association peuvent être reconnues par un nom identique.</p><div className="note" role="status"><strong>✅ {selectedOverview.taskProgress.done} tâche(s) terminée(s) sur {selectedOverview.taskProgress.total}</strong><p>📋 {selectedOverview.taskProgress.remaining} tâche(s) restent à faire.</p><progress value={selectedOverview.taskProgress.done} max={Math.max(1,selectedOverview.taskProgress.total)} aria-label="Avancement des tâches" style={{width:"100%"}}/></div><button type="button" className="secondary" disabled={demoReadOnly||!eventOptions.some(r=>r.values[0]===overviewEvent)} onClick={()=>{const event=eventOptions.find(r=>r.values[0]===overviewEvent);if(!event)return;const proposals=DRIVE_CHECKLISTS[checklistTemplateName]?suggestDriveChecklistTasks(checklistTemplateName,event.id,data.tasks||[]):suggestChecklistTasks(overviewEvent,event.id,data.tasks||[]);if(!proposals.length){setChecklistStatus("Toutes les tâches proposées sont déjà présentes.");return;}setData(old=>({...old,tasks:[...(old.tasks||[]),...(DRIVE_CHECKLISTS[checklistTemplateName]?suggestDriveChecklistTasks(checklistTemplateName,event.id,old.tasks||[]):suggestChecklistTasks(overviewEvent,event.id,old.tasks||[])).map(r=>({...r,id:crypto.randomUUID()}))]}));setChecklistStatus(proposals.length+" tâche(s) ajoutée(s) à la manifestation.");}}>📋 Ajouter la vraie check-list de préparation</button>{checklistStatus&&<p role="status">{checklistStatus}</p>}<p className="note">{DRIVE_CHECKLISTS[checklistTemplateName]?"Liste issue du Google Drive du comité, classée par étapes.":"Modèle général de préparation."} Ajoute uniquement les tâches manquantes, non cochées, pour cette manifestation. Vous pourrez les attribuer et les compléter dans l’onglet Tâches.</p>{DRIVE_CHECKLISTS[checklistTemplateName]&&eventOptions.some(r=>r.values[0]===overviewEvent)&&<div className="event-phase-list" aria-label="Check-list par étape">{checklistProgress(data.tasks||[],eventOptions.find(r=>r.values[0]===overviewEvent).id,Object.keys(DRIVE_CHECKLISTS[checklistTemplateName].phases)).map(group=><details key={group.phase} className="event-phase"><summary><strong>{group.phase}</strong><span>{group.done} / {group.total} fait(s)</span></summary>{group.total===0?<p>Ajoutez la check-list pour afficher les tâches.</p>:<div className="phase-items">{group.rows.map(task=><label key={task.id} className="phase-item"><input type="checkbox" checked={task.done===true} disabled={demoReadOnly} onChange={()=>toggleTaskDone(task.id)}/><span>{task.values[0]}</span></label>)}</div>}</details>)}</div>}<div className="purchase-assistant"><button type="button" className="secondary" disabled={demoReadOnly||!eventOptions.some(r=>r.values[0]===overviewEvent)} onClick={()=>{const event=eventOptions.find(r=>r.values[0]===overviewEvent);if(!event)return;const proposals=suggestEventPurchases(event.id,data.tasks||[],data.shopping||[]);if(!proposals.length){setChecklistStatus("Aucun nouvel achat détecté dans les tâches de cette manifestation.");return;}if(!window.confirm("Ajouter "+proposals.length+" article(s) à la liste Achats de cette manifestation ? Les quantités resteront à préciser. Aucun achat ni mouvement de stock ne sera effectué."))return;setData(old=>({...old,shopping:[...(old.shopping||[]),...suggestEventPurchases(event.id,old.tasks||[],old.shopping||[]).map(r=>({...r,id:crypto.randomUUID()}))]}));setChecklistStatus(proposals.length+" article(s) ajouté(s) aux Achats, à vérifier.");}}>🛒 Préparer les achats depuis les tâches</button><p className="note">Propose les fournitures repérées dans la check-list (gaz, boissons, pain, écocups…). Quantités à vérifier. Aucun achat automatique.</p></div><details className="event-phase"><summary><strong>📦 Comparer les achats au stock</strong></summary><p className="note">Comparaison indicative des noms et quantités saisis. Aucun stock n’est réservé ou déduit. Vérifier les unités, l’état du matériel et les autres manifestations.</p><div className="stock-summary" role="status">{(()=>{const summary=summarizeStockComparison(compareShoppingWithStock(data.shopping||[],data.stock||[],eventOptions.find(r=>r.values[0]===overviewEvent)?.id||""));return <><div className="stock-summary-tile ok"><strong>{summary.sufficient}</strong><span>Disponibles*</span></div><div className="stock-summary-tile warn"><strong>{summary.shortage}</strong><span>À compléter</span></div><div className="stock-summary-tile unknown"><strong>{summary.verify}</strong><span>À vérifier</span></div></>})()}</div><div className="stock-comparison">{compareShoppingWithStock(data.shopping||[],data.stock||[],eventOptions.find(r=>r.values[0]===overviewEvent)?.id||"").map(item=><div className={"stock-comparison-item "+(item.status==="Stock théoriquement suffisant"?"stock-ok":item.status==="Complément à prévoir"?"stock-warn":"stock-unknown")} key={item.id}><span className="stock-status-icon" aria-hidden="true">{item.status==="Stock théoriquement suffisant"?"✓":item.status==="Complément à prévoir"?"!":"?"}</span><div className="stock-item-content"><strong>{item.name}</strong><span>{item.status}</span><small>Besoin : {item.needed??"?"} · Stock : {item.available??"?"}{item.toBuy!==null?" · À prévoir : "+item.toBuy:""}</small></div></div>)}</div><p className="note">*Disponibles selon les chiffres saisis, sous réserve des unités et des autres utilisations.</p></details><div className="next-edition"><label>Nouvelle édition (année)<input type="number" min="2020" max="2099" value={nextEditionYear} onChange={e=>setNextEditionYear(e.target.value)}/></label><button type="button" className="secondary" disabled={demoReadOnly||!eventOptions.some(r=>r.values[0]===overviewEvent)} onClick={()=>{const source=eventOptions.find(r=>r.values[0]===overviewEvent);if(!source)return;try{const plan=planNextEdition(data.events||[],data.tasks||[],source.id,nextEditionYear);if(!window.confirm("Créer "+plan.eventValues[0]+" avec "+plan.tasks.length+" tâche(s) à refaire ? L’édition actuelle et ses affectations seront conservées."))return;const newId=crypto.randomUUID();setData(old=>({...old,events:[...(old.events||[]),{id:newId,values:plan.eventValues}],tasks:[...(old.tasks||[]),...plan.tasks.map(t=>({...t,id:crypto.randomUUID(),eventId:newId}))]}));setOverviewEvent(plan.eventValues[0]);setChecklistStatus("Édition "+plan.eventValues[0]+" créée. Les anciennes tâches restent intactes.");}catch(err){setChecklistStatus("⚠ "+err.message);}}}>📅 Préparer l’édition suivante</button><p className="note">Crée une nouvelle manifestation avec les tâches remises à faire. Dates et responsables sont à renseigner ; l’historique de l’édition précédente est conservé.</p></div><div className="till-grid">{[["tasks","✅ Tâches"],["shopping","🛒 Achats"],["stock","📦 Stock"],["shifts","🕒 Bénévoles"],["feedback","📝 Retours"],["finance","📊 Finances"]].map(([key,label])=><button type="button" className="till-product" key={key} onClick={()=>{setTab(key);setFilter("");setEditingId(null);setRecordEventId(eventOptions.find(r=>r.values[0]===overviewEvent)?.id||"");setForm(["","",""]);setFormError("")}}><strong>{label}</strong><span>{selectedOverview.counts[key]} fiche(s) liée(s)</span><span>Ouvrir le module</span></button>)}</div><p className="note">Aperçu de démonstration uniquement : les fiches non attribuées ne sont pas modifiées.</p></section>
 <section className="panel" aria-label="Caisse tactile"><label>Manifestation<select value={tillEvent} onChange={e=>{setTillEvent(e.target.value);setTillCart({});setTillEdit(false)}}>{eventNames.map(name=><option key={name} value={name}>{name}</option>)}</select></label><div className="heading"><h2>🧾 Caisse rapide</h2><span className="demo">Essai sans paiement</span></div><p>Tarifs fictifs à remplacer avant utilisation. Panier propre à ce téléphone, non synchronisé. Aucun encaissement SumUp déclenché.</p><button type="button" className="secondary" onClick={()=>tillEdit?setTillEdit(false):openTillEditor()}>{tillEdit?"Fermer les réglages":"⚙ Personnaliser produits et tarifs"}</button>{tillConfigWarning&&<p role="status">{tillConfigWarning}</p>}{tillEdit&&<div className="note"><h3>Produits de cette manifestation</h3>{tillDraft.map((p,i)=><div key={p.id} className="fields"><label><input type="checkbox" checked={p.enabled} onChange={e=>setTillDraft(old=>old.map((x,j)=>j===i?{...x,enabled:e.target.checked}:x))}/> {TILL_PRODUCTS.find(x=>x.id===p.id).name}</label><label>Prix (€)<input inputMode="decimal" value={p.price} onChange={e=>setTillDraft(old=>old.map((x,j)=>j===i?{...x,price:e.target.value}:x))}/></label></div>)}<button type="button" disabled={!!initialTillConfig.warning} onClick={saveTillEditor}>Enregistrer ce menu</button></div>}<div className="till-actions"><button type="button" className="secondary" onClick={exportMenus}>Exporter les menus</button><button type="button" className="secondary" onClick={()=>tillImportRef.current?.click()}>Importer les menus</button><input type="file" ref={tillImportRef} accept=".json,application/json" style={{display:"none"}} onChange={importMenus}/></div><div className="till-grid">{tillProducts.map(p=><button type="button" className="till-product" key={p.id} onClick={()=>setTillCart(c=>changeQuantity(c,p.id,1,tillProducts))}><span className="till-icon">{p.icon}</span><strong>{p.name}</strong><span>{(p.priceCents/100).toFixed(2).replace(".",",")} €</span><span>× {tillCart[p.id]||0}</span></button>)}</div><div className="heading"><strong>Total : {(calculateTill(tillCart,tillProducts)/100).toFixed(2).replace(".",",")} €</strong><button className="secondary" type="button" onClick={()=>setTillCart({})}>Vider le panier</button></div><div className="till-actions">{TILL_PRODUCTS.filter(p=>tillCart[p.id]>0).map(p=><button type="button" className="secondary" key={p.id} onClick={()=>setTillCart(c=>changeQuantity(c,p.id,-1,tillProducts))}>− 1 {p.name}</button>)}</div><p className="note">Paiement par carte et espèces : non activé. Ne pas utiliser comme caisse réelle tant que les tarifs, la sauvegarde et le rapprochement SumUp ne sont pas validés.</p></section>
 <nav aria-label="Modules">{categories.map(c=><button key={c.key} className={tab===c.key?"active":""} onClick={()=>openModule(c.key)}>{c.icon} {c.title}</button>)}</nav>
 <section className="panel module-panel" ref={modulePanelRef} tabIndex={-1} aria-label={current.title}><div className="heading"><h2>{current.icon} {current.title}</h2><button className="secondary" onClick={()=>exportCsv(false)}>Exporter CSV</button></div>
 {tab==="ecocups"&&<div className="note"><p><strong>Calcul local de démonstration uniquement — aucun stock partagé.</strong> Saisir les mouvements exactement sous la forme « entrée » ou « sortie », et une quantité entière positive.</p><div className="fields"><label>Stock initial de démonstration<input inputMode="numeric" disabled={demoReadOnly} value={ecocupOpening} onChange={e=>setEcocupOpening(e.target.value)}/></label><label>Seuil d'alerte<input inputMode="numeric" disabled={demoReadOnly} value={ecocupThreshold} onChange={e=>setEcocupThreshold(e.target.value)}/></label></div>{ecocupError?<p role="alert">⚠ Calcul impossible : {ecocupError}. Vérifiez les mouvements, sans les effacer.</p>:<div className={"ecocup-balance-card "+(ecocupSummary.alert?"ecocup-balance-alert":"ecocup-balance-ok")} role="status"><span className="ecocup-balance-icon" aria-hidden="true">{ecocupSummary.alert?"⚠️":"✅"}</span><div><strong className="ecocup-balance-count">{ecocupSummary.balance} écocups</strong><p>{ecocupSummary.alert?"Seuil atteint : prévoir au moins "+(ecocupSummary.minimumToClearAlert??"une quantité à vérifier")+" écocups supplémentaires.":"Stock de démonstration au-dessus du seuil."}</p><small>Calcul local uniquement · aucune réservation de stock réel</small></div></div>}</div>}
 {tab==="recipes"&&<div className="note"><h3>🧮 Calculateur de quantités</h3><p>Choisissez une recette enregistrée. Les ingrédients doivent être saisis un par ligne (ex. : 250 g farine). Le calcul ne modifie jamais la recette originale.</p><label>Recette à calculer<select value={selectedRecipeId} onChange={e=>{setSelectedRecipeId(e.target.value);setRecipeOutput("");}}><option value="">Choisir une recette</option>{(data.recipes||[]).map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label><div className="fields"><label>Recette prévue pour<input inputMode="numeric" value={recipeServings} onChange={e=>setRecipeServings(e.target.value)}/></label><label>Nombre de personnes souhaité<input inputMode="numeric" value={recipeTarget} onChange={e=>setRecipeTarget(e.target.value)}/></label></div><button type="button" disabled={!selectedRecipeId} onClick={()=>{try{const recipe=(data.recipes||[]).find(r=>r.id===selectedRecipeId);if(!recipe)throw new Error("Recette introuvable.");setRecipeOutput(scaleRecipeText(recipe.values[1],Number(recipeServings),Number(recipeTarget)))}catch(e){setRecipeOutput("⚠ "+e.message)}}}>Calculer les ingrédients</button>{recipeOutput&&<pre role="status" style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{recipeOutput}</pre>}</div>}
 <form onSubmit={add}>
  {tab!=="events"&&tab!=="contacts"&&tab!=="ecocups"&&<label>Manifestation associée<select value={recordEventId} onChange={e=>setRecordEventId(e.target.value)}><option value="">Non attribuée</option>{eventOptions.map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label>}
  {formError&&<p role="alert">{formError}</p>}
  <div className="fields">
   {tab==="shifts"&&<label>Choisir dans l’annuaire<select value={volunteers.some(v=>v.name===form[0])?form[0]:""} onChange={e=>setForm(f=>f.map((v,i)=>i===0?e.target.value:v))}><option value="">Saisie manuelle / autre bénévole</option>{volunteers.map(v=><option key={v.id} value={v.name}>{v.name}</option>)}</select></label>}
   {current.fields.map((label,i)=><label key={label}>{label}
    {tab==="contacts"&&i===1?
     <select required value={form[i]} onChange={e=>setForm(f=>f.map((v,j)=>i===j?e.target.value:v))}>
      <option value="">Choisir une catégorie</option>
      {["bénévole","exposant","groupe","fournisseur","intervenant"].map(kind=><option key={kind} value={kind}>{kind}</option>)}
      {form[i]&&!["bénévole","exposant","groupe","fournisseur","intervenant"].includes(form[i])&&<option value={form[i]}>{form[i]} (ancienne catégorie)</option>}
     </select>:
     <>{tab==="shifts"&&i===2&&<div className="post-choices">{volunteerPosts.map(post=><button key={post} type="button" className={form[2]===post?"post-choice selected":"post-choice"} aria-pressed={form[2]===post} onClick={()=>setForm(f=>f.map((v,j)=>j===2?post:v))}>{post}</button>)}</div>}<input required={i===0} value={form[i]} onChange={e=>setForm(f=>f.map((v,j)=>i===j?e.target.value:v))} placeholder={label}/></>}
   </label>)}
   {tab==="contacts"&&<>
    <label>E-mail<input type="email" autoComplete="off" maxLength={320} value={contactEmail} onChange={e=>setContactEmail(e.target.value)} placeholder="adresse@exemple.fr"/></label>
    <label>Téléphone<input type="tel" inputMode="tel" autoComplete="off" maxLength={64} value={contactPhone} onChange={e=>setContactPhone(e.target.value)} placeholder="06 00 00 00 00"/></label>
   </>}
  </div>
  {tab==="contacts"&&<p className="note">Les anciennes coordonnées du champ libre restent intactes. Recopiez-les dans E-mail ou Téléphone après vérification.</p>}
  <button type="submit" disabled={demoReadOnly}>{editingId?"Enregistrer les modifications":"+ Ajouter"}</button>
  {editingId&&<button type="button" className="secondary" onClick={cancelEdit}>Annuler la modification</button>}
 </form>
 {tab==="shifts"&&<section className="volunteer-agenda" aria-label="Planning des bénévoles par manifestation"><h3>🕒 Qui fait quoi ?</h3><div className="needs-backup-actions"><button type="button" onClick={downloadVolunteerNeeds}>💾 Sauvegarder les besoins</button><label className="needs-import">📂 Restaurer les besoins<input type="file" accept=".json,application/json" disabled={demoReadOnly} onChange={uploadVolunteerNeeds}/></label></div><button type="button" className="secondary" disabled={!printEvent||!printSchedule?.total} onClick={()=>window.print()}>🖨️ Imprimer le planning</button><label>Manifestation à afficher<select value={recordEventId} onChange={e=>setRecordEventId(e.target.value)}><option value="">Choisir une manifestation</option>{eventOptions.map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label>{recordEventId?(()=>{const schedule=volunteerSchedule(data.shifts||[],recordEventId);const summary=volunteerPostSummary(data.shifts||[],recordEventId,volunteerPosts);return <><p role="status">{schedule.total} affectation(s) pour cette manifestation</p><div className="volunteer-role-grid" aria-label="Répartition des bénévoles par poste">{summary.posts.map(item=>{const target=volunteerNeeds[recordEventId]?.[item.post];const status=staffingStatus(item.count,target);return <div className="volunteer-role-card" key={item.post}><span>{item.post}</span><strong>{item.count}{target!==undefined?` / ${target}`:""}</strong><small>{status.label}</small><label>Besoin<input aria-label={"Besoin pour "+item.post} type="number" min="0" max="1000" step="1" disabled={demoReadOnly} value={target??""} placeholder="À définir" onChange={e=>{const value=e.target.value;if(value!==""&&(!/^\d+$/.test(value)||Number(value)>1000))return;setVolunteerNeeds(old=>{const next={...old,[recordEventId]:{...(old[recordEventId]||{})}};if(value==="")delete next[recordEventId][item.post];else next[recordEventId][item.post]=Number(value);return next;});}}/></label></div>})}</div>{needsWarning&&<p role="alert">{needsWarning}</p>}{(summary.other>0||summary.unassigned>0)&&<p className="note">{summary.other>0?`${summary.other} affectation(s) sur d’autres postes. `:""}{summary.unassigned>0?`${summary.unassigned} poste(s) à préciser.`:""}</p>}<div className="agenda-list">{schedule.scheduled.map(r=><article key={r.id} className="agenda-item"><strong className="agenda-time">{r.time}</strong><div><strong>{r.name}</strong><p>{r.post||"Poste non précisé"}</p></div></article>)}</div>{schedule.unscheduled.length>0&&<div className="note"><strong>Créneaux à préciser ({schedule.unscheduled.length})</strong>{schedule.unscheduled.map(r=><p key={r.id}>{r.name} — {r.post||"Poste non précisé"} ({r.time||"horaire manquant"})</p>)}</div>}{schedule.total===0&&<p>Aucun bénévole affecté pour le moment.</p>}</>})():<p>Sélectionnez une manifestation pour consulter ses créneaux.</p>}</section>}
 {tab==="shifts"&&<p className="note">Choisissez un bénévole dans l’annuaire ou saisissez son nom manuellement. Seuls les contacts classés « bénévole » sont proposés. Planning local : indiquez les créneaux au format 10:00-12:30. Si un bénévole a deux créneaux qui se chevauchent sur la même manifestation, l’enregistrement est refusé. Les horaires sans date ne permettent pas de vérifier les conflits entre journées différentes.</p>}
 {tab==="tasks"&&<p role="status" className="note">✅ {(data.tasks||[]).filter(r=>r.done===true).length} tâche(s) terminée(s) sur {(data.tasks||[]).length}. Cochez une tâche pour la marquer comme faite ; responsable et échéance sont conservés.</p>}
 {tab==="contacts"&&<div className="note"><p>Retrouvez rapidement les bénévoles, exposants et groupes. L’export CSV concerne uniquement cet appareil.</p><div className="fields"><label>Afficher les contacts<select value={contactType} onChange={e=>setContactType(e.target.value)}><option value="tous">Tous les contacts</option><option value="bénévole">Bénévoles</option><option value="exposant">Exposants</option><option value="groupe">Groupes</option></select></label></div><p>{records.length} fiche(s) affichée(s).</p><button type="button" className="contact-export-button" onClick={()=>exportCsv(true)} disabled={!records.length}>📥 Exporter uniquement ces contacts en CSV</button><p className="contact-export-note">CSV avec e-mail et téléphone séparés, sans supprimer l’ancien contact libre. Export local uniquement : vérifiez les destinataires avant tout partage.</p></div>}
 <label className="search">Rechercher<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrer les fiches…"/></label>
 <div className="records">{records.length?records.map(r=><article key={r.id}>{tab==="tasks"&&<label><input type="checkbox" checked={r.done===true} disabled={demoReadOnly} onChange={()=>toggleTaskDone(r.id)}/> {r.done?"Terminée":"À faire"}</label>}<div><strong>{r.values[0]}</strong><p>{r.values.slice(1).filter(Boolean).join(" · ")||"Aucune précision"}</p>{tab==="contacts"&&(r.email||r.phone)&&<p>{[r.email&&"✉️ "+r.email,r.phone&&"📞 "+r.phone].filter(Boolean).join(" · ")}</p>}</div><button className="secondary" disabled={demoReadOnly} onClick={()=>beginEdit(r)}>Modifier</button><button className="delete" disabled={demoReadOnly} onClick={()=>remove(r.id)} aria-label={"Supprimer "+r.values[0]}>Supprimer</button></article>):<p>Aucune fiche pour le moment.</p>}</div>
 </section>
 <section className="print-sheet" aria-label="Planning imprimable des bénévoles"><h1>FEST’APP — Planning bénévoles</h1><h2>{printEvent?.values[0]||"Manifestation non sélectionnée"}</h2><p>{printEvent?.values[1]?"Date : "+printEvent.values[1]:"Date non renseignée"} · {printEvent?.values[2]||"Lieu non renseigné"}</p><table><thead><tr><th>Horaires</th><th>Bénévole</th><th>Poste</th></tr></thead><tbody>{(printSchedule?.scheduled||[]).map(r=><tr key={r.id}><td>{r.time}</td><td>{r.name}</td><td>{r.post||"À préciser"}</td></tr>)}</tbody></table>{printSchedule?.unscheduled.length>0&&<><h3>Horaires à préciser</h3><table><thead><tr><th>Bénévole</th><th>Poste</th><th>Créneau saisi</th></tr></thead><tbody>{printSchedule.unscheduled.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.post||"À préciser"}</td><td>{r.time||"Non renseigné"}</td></tr>)}</tbody></table></>}<p className="print-footer">Document issu de la démonstration locale FEST’APP — vérifier les affectations avant affichage.</p></section>
 <footer>Prototype local • aucune donnée synchronisée</footer>
 </main>
}
createRoot(document.getElementById("root")).render(<App/>);
