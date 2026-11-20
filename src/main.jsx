import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";
import SharedAccess from "./SharedAccess.jsx";
import {persistCloudSnapshot} from "./lib/supabaseCloudImport.js";
import PhotoVault from "./PhotoVault.jsx";
import EquipmentGrid from "./EquipmentGrid.jsx";
import RecordCardGrid from "./RecordCardGrid.jsx";
import VolunteerPhotoPicker from "./VolunteerPhotoPicker.jsx";
import ModuleGlyph from "./ModuleGlyph.jsx";
import DriveBoard from "./DriveBoard.jsx";
import OwnerSetup from "./OwnerSetup.jsx";
import BulkEntry from "./BulkEntry.jsx";
import FreeAiHelper from "./FreeAiHelper.jsx";
import ManifestationHub from "./ManifestationHub.jsx";
import FestivalSettings from "./FestivalSettings.jsx";
import EventTill from "./EventTill.jsx";
import EventReport from "./EventReport.jsx";
import BottomNavigation from "./BottomNavigation.jsx";
import {createTodo} from "./lib/eventTodo.js";
import {createReportNote,createPendingReportExpense} from "./lib/eventReport.js";
import {recordsForManifestation,withRecordEventId} from "./lib/manifestationScope.js";
import {PHOTO_CATEGORIES,listAllPhotoOriginals,savePhotoOriginal,validatePhotoInput,saveRestoredPhotoOriginals,rollbackRestoredPhotoOriginals} from "./lib/photoVault.js";
import {makeCompleteBackupZip} from "./lib/photoZip.js";
import {readCompleteBackupZip,planCompleteZipRestore} from "./lib/completeZipRestore.js";
import {persistCompleteZipRestore} from "./lib/completeZipCommit.js";
import {OWNER_REVIEW_KEY,parseOwnerReviews} from "./lib/ownerSetup.js";
import {createEventPostDraft} from "./lib/postDrafts.js";
import {buildCsv} from "./lib/csv.js";
import {CONTACT_EXPORT_COLUMNS,selectContactsWithDetailsForExport} from "./lib/contactExport.js";
import {sortContactsByName} from "./lib/contactSort.js";
import {validateContactDetails} from "./lib/contactDetails.js";
import {eventOverview} from "./lib/eventOverview.js";
import {suggestChecklistTasks,suggestDriveChecklistTasks,DRIVE_CHECKLISTS} from "./lib/eventChecklist.js";
import {checklistProgress} from "./lib/checklistProgress.js";
import {planNextEdition} from "./lib/eventEdition.js";
import {createFestivalEdition,updateEventDetails} from "./lib/eventEditions.js";
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
import {addMissingRecipeDrafts} from "./lib/recipeStarters.js";
import {hasUnsavedDraft} from "./lib/unsavedDraft.js";
import {TILL_PRODUCTS} from "./lib/quickTill.js";
import {createTillFinanceRecord,createTillCorrectionRecord,listTillSales,summarizeTillSales} from "./lib/tillSales.js";
import {loadTillConfig,eventTillProducts,saveTillConfig,exportTillConfig,importTillConfig} from "./lib/tillConfig.js";
import {summarizeEcocups} from "./lib/ecocupDemoBalance.js";
import {ECOCUP_DEMO_SETTINGS_KEY,serializeDemoEcocupSettings} from "./lib/ecocupDemoSettings.js";
import {createCombinedDemoBackup,inspectCombinedEcocupSettings,inspectCombinedVolunteerNeeds,mergeMissingVolunteerNeeds} from "./lib/combinedDemoBackup.js";
import {readDemoStorage,writeDemoStorage} from "./lib/demoStorage.js";
import {inspectDemoBackupReadiness} from "./lib/demoBackupReadiness.js";
import {planDemoRestore} from "./lib/demoRestorePlan.js";
import {previewRestoreImpact} from "./lib/restorePreview.js";
import {applyDemoRestore} from "./lib/applyDemoRestore.js";
import {mergeDriveSeed} from "./lib/mergeDriveSeed.js";
import {DRIVE_FOLDERS} from "./lib/driveFolders.js";
import {BULK_ENTRY_CATEGORIES,appendBulkEntry} from "./lib/bulkEntry.js";

const DRIVE_IMPORT_KEY="festapp-drive-snapshot-20261118-v1";

const categories=[
{key:"events",title:"Manifestations",icon:"🎉",fields:["Nom","Date","Lieu"]},
{key:"tasks",title:"Tâches",icon:"✅",fields:["Tâche","Responsable","Échéance"]},
{key:"shopping",title:"Achats",icon:"🛒",fields:["Article","Quantité","État"]},
{key:"stock",title:"Stock",icon:"📦",fields:["Article","Quantité","Seuil d'alerte"]},
{key:"ecocups",title:"Écocups",icon:"🥤",fields:["Mouvement","Quantité","Manifestation"]},
{key:"contacts",title:"Annuaire",icon:"👥",fields:["Nom","Catégorie","Contact libre (ancienne fiche / note)"]},
{key:"shifts",title:"Planning bénévoles",icon:"🕒",fields:["Bénévole","Créneau","Poste"]},
{key:"feedback",title:"Retours",icon:"📝",fields:["Sujet du retour","Type","Remarque"]},
{key:"recipes",title:"Recettes",icon:"🍲",fields:["Nom","Ingrédients","Préparation"]},
{key:"finance",title:"Bilan financier",icon:"📊",fields:["Libellé","Montant (€)","Nature"]},
{key:"equipment",title:"Matériel",icon:"🧰",fields:["Matériel","Quantité","Emplacement / prêt à"]},
{key:"posts",title:"Communication & photos",icon:"📣",fields:["Titre de la publication","Texte Facebook","Statut"]},
{key:"archives",title:"Archives & mémoire",icon:"🗂️",fields:["Document / souvenir","Année / manifestation","Notes utiles"]}
];
const eventModuleShortcuts=["tasks","shifts","shopping","recipes","equipment","posts","finance","feedback","archives","stock","ecocups"];
const eventNames=["Concours de belote","Carnaval","Chasse aux œufs","Fête des voisins","Fanfare","Vide-grenier","Saint-Laurent","Halloween","Marché de Noël"];
const seed={events:eventNames.map((name,i)=>({id:"seed-"+i,values:[name,"",""]}))};
function load(){
 const result=readDemoStorage(localStorage,seed);
 if(result.readOnly)return result;
 // Show the two specifically requested recipes as unapproved drafts. Never
 // replace a recipe already imported or edited by the committee.
 return {...result,data:{...result.data,recipes:addMissingRecipeDrafts(result.data.recipes||[]).recipes}};
}
function App(){
 const [initialStorage]=useState(load);
 const [initialNeedsStorage]=useState(()=>readDemoVolunteerNeeds(localStorage));
 const [initialEcocupStorage]=useState(()=>readDemoEcocupSettings(localStorage));
 const [data,setData]=useState(initialStorage.data);
 const [driveCatalog,setDriveCatalog]=useState(null);
 const [driveLoading,setDriveLoading]=useState(true);
 const [driveError,setDriveError]=useState("");
 const [driveImportStatus,setDriveImportStatus]=useState("");
 const [storageWarning,setStorageWarning]=useState(initialStorage.warning);
 const demoReadOnly=initialStorage.readOnly||initialNeedsStorage.readOnly||initialEcocupStorage.readOnly;
 const initialRender=useRef(true);
 const [tab,setTab]=useState("events");
 const [hubEventId,setHubEventId]=useState("");
 const [reportOpen,setReportOpen]=useState(false);
 const [reportDraftDirty,setReportDraftDirty]=useState(false);
 const [settingsOpen,setSettingsOpen]=useState(false);
 const [tillOpen,setTillOpen]=useState(false);
 const [moduleScopeEventId,setModuleScopeEventId]=useState("");
 const [orgTodosOpen,setOrgTodosOpen]=useState(false);
 const [form,setForm]=useState(["","",""]);
 const [contactEmail,setContactEmail]=useState("");
 const [contactPhone,setContactPhone]=useState("");
 const [contactPhotoFile,setContactPhotoFile]=useState(null);
 const [contactPhotoPreview,setContactPhotoPreview]=useState("");
 const [contactPhotoBusy,setContactPhotoBusy]=useState(false);
 const contactPhotoSavingRef=useRef(false);
 const [returnToVolunteerEventId,setReturnToVolunteerEventId]=useState("");
 const [filter,setFilter]=useState("");
 const [contactType,setContactType]=useState("tous");
 const [contactFormOpen,setContactFormOpen]=useState(false);
 const [contactSearchOpen,setContactSearchOpen]=useState(false);
 const contactSearchRef=useRef(null);
 const contactFormRef=useRef(null);
 const [equipmentFormOpen,setEquipmentFormOpen]=useState(false);
 const [equipmentSearchOpen,setEquipmentSearchOpen]=useState(false);
 const equipmentSearchRef=useRef(null);
 const equipmentFormRef=useRef(null);
 const [moduleFormOpen,setModuleFormOpen]=useState(false);
 const [moduleSearchOpen,setModuleSearchOpen]=useState(false);
 const moduleSearchRef=useRef(null);
 const moduleFormRef=useRef(null);
 const [exportCategory,setExportCategory]=useState("contacts");
 const [exportContactType,setExportContactType]=useState("tous");
 const [exportStatus,setExportStatus]=useState("");
 const [editingId,setEditingId]=useState(null);
 const modulePanelRef=useRef(null);
 const moduleWorkbenchRef=useRef(null);
 const recipeCalculatorRef=useRef(null);
 const advancedRef=useRef(null);
 const ownerSetupRef=useRef(null);
 const [recipeServings,setRecipeServings]=useState("10");
 const [recipeTarget,setRecipeTarget]=useState("50");
 const [recipeOutput,setRecipeOutput]=useState("");
 const [recipeDraftStatus,setRecipeDraftStatus]=useState("");
 const [postKind,setPostKind]=useState("annonce");
 const [postTone,setPostTone]=useState("chaleureux");
 const [postStatus,setPostStatus]=useState("");
 const [selectedRecipeId,setSelectedRecipeId]=useState("");
 const [overviewEvent,setOverviewEvent]=useState("Marché de Noël");
 const [checklistStatus,setChecklistStatus]=useState("");
 const [nextEditionYear,setNextEditionYear]=useState(String(new Date().getFullYear()+1));
 const [recordEventId,setRecordEventId]=useState("");
 const [volunteerNeeds,setVolunteerNeeds]=useState(initialNeedsStorage.needs);
 const [needsWarning,setNeedsWarning]=useState("");
 const eventOptions=(data.events||[]).filter(r=>r?.id&&r?.values?.[0]);
 const [tillCart,setTillCart]=useState({});
 const [tillSaleStatus,setTillSaleStatus]=useState("");
 const recordingTillSaleRef=useRef(false);
 const [tillEvent,setTillEvent]=useState("Marché de Noël");
 const [initialTillConfig]=useState(()=>loadTillConfig(localStorage));
 const [tillConfig,setTillConfig]=useState(initialTillConfig.config);
 const [tillConfigWarning,setTillConfigWarning]=useState(initialTillConfig.warning);
 const [tillEdit,setTillEdit]=useState(false);
 const tillImportRef=useRef(null);
 const [tillDraft,setTillDraft]=useState([]);
 const tillProducts=eventTillProducts(tillEvent,tillConfig);
 const tillSaleSummary=summarizeTillSales(data.finance||[],hubEventId);
 const tillSaleHistory=listTillSales(data.finance||[],hubEventId);
 const activeManifestation=eventOptions.find(event=>event.id===hubEventId);
 const [backupPreview,setBackupPreview]=useState("");
 const [restoreCandidate,setRestoreCandidate]=useState(null);
 const [fullZipCandidate,setFullZipCandidate]=useState(null);
 const [fullZipPreview,setFullZipPreview]=useState("");
 const [fullZipBusy,setFullZipBusy]=useState(false);
 const [photoRefreshRevision,setPhotoRefreshRevision]=useState(0);
 const [reviewRestoreRevision,setReviewRestoreRevision]=useState(0);
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
 useEffect(()=>{
  if(!contactPhotoFile){setContactPhotoPreview("");return;}
  const url=URL.createObjectURL(contactPhotoFile);
  setContactPhotoPreview(url);
  return ()=>URL.revokeObjectURL(url);
 },[contactPhotoFile]);
 useEffect(()=>{
  let cancelled=false;
  fetch(`${import.meta.env.BASE_URL}drive-data.json`,{cache:"no-store"}).then(async response=>{
   if(!response.ok)throw new Error("Le catalogue privé n'est pas disponible sur cette installation.");
   const payload=await response.json();
   if(!payload||payload.version!==1||!Array.isArray(payload.files)||!payload.seed||!payload.stats||payload.files.length>10000)throw new Error("Format du catalogue Drive invalide.");
   if(cancelled)return;
   setDriveCatalog(payload);
   if(payload.seed.events?.some(r=>r.values?.[0]==="Marché de Noël 2026"))setOverviewEvent(current=>current==="Marché de Noël"?"Marché de Noël 2026":current);
   if(!demoReadOnly&&localStorage.getItem(DRIVE_IMPORT_KEY)!==payload.asOf){
    setData(old=>mergeDriveSeed(old,payload.seed).data);
    try{localStorage.setItem(DRIVE_IMPORT_KEY,payload.asOf);}catch{/* The normal local save warning covers blocked storage. */}
    setDriveImportStatus("✅ Fiches du Drive ajoutées au premier chargement, sans remplacement des saisies locales.");
   }
  }).catch(error=>{if(!cancelled)setDriveError(error.message||"Catalogue indisponible.");}).finally(()=>{if(!cancelled)setDriveLoading(false);});
  return ()=>{cancelled=true;};
 },[]);
 function importDriveAgain(){
  if(!driveCatalog||demoReadOnly)return;
  try{const result=mergeDriveSeed(data,driveCatalog.seed);if(result.added)setData(result.data);setDriveImportStatus(result.added?`✅ ${result.added} fiche(s) manquante(s) ajoutée(s), sans écrasement.`:"✅ Tout est déjà présent. Aucune fiche modifiée.");}
  catch(e){setDriveImportStatus("⚠ Import non effectué : "+e.message);}
 }
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
 const scopeEvent=eventOptions.find(r=>r.id===moduleScopeEventId);
 const filteredRecords=recordsForManifestation(data[tab]||[],tab,moduleScopeEventId).filter(r=>tab==="contacts"
  ?(contactType==="tous"||normalizeContact(r.values[1])===normalizeContact(contactType))&&[...r.values,r.email||"",r.phone||""].some(value=>normalizeContact(value).includes(normalizeContact(filter)))
  :r.values.join(" ").toLocaleLowerCase().includes(filter.toLocaleLowerCase()));
 const records=tab==="contacts"?sortContactsByName(filteredRecords):filteredRecords;
 const draftIsDirty=hasUnsavedDraft({
  open:tab==="contacts"?contactFormOpen:tab==="equipment"?equipmentFormOpen:moduleFormOpen,
  form,editingId,records:data[tab]||[],eventId:recordEventId,
  email:tab==="contacts"?contactEmail:"",phone:tab==="contacts"?contactPhone:""
 })||!!contactPhotoFile||reportDraftDirty;
 function allowDiscardDraft(){
  if(contactPhotoSavingRef.current)return false;
  return !draftIsDirty||window.confirm("Cette fiche n'est pas enregistrée. Quitter sans conserver les modifications ?");
 }
 useEffect(()=>{
  if(!draftIsDirty)return;
  const warn=event=>{event.preventDefault();event.returnValue="";};
  window.addEventListener('beforeunload',warn);
  return ()=>window.removeEventListener('beforeunload',warn);
 },[draftIsDirty]);
 async function add(e){
  e.preventDefault();
  if(demoReadOnly){setFormError("Mode lecture seule : les données locales existantes sont protégées.");return;}
  if(!form[0].trim())return;
  let details={};
  if(tab==="contacts"){
   if(!form[1].trim()){setFormError("Choisissez une catégorie pour ce contact.");return;}
   try{details=validateContactDetails(contactEmail,contactPhone)}
   catch(err){setFormError(err.message);return;}
  }
  const row=withRecordEventId({id:editingId||crypto.randomUUID(),values:form.map(x=>x.trim()),...details},tab!=="events"?recordEventId:"");
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
  if(tab==="contacts"&&contactPhotoFile){
   if(contactPhotoSavingRef.current)return;
   contactPhotoSavingRef.current=true;setContactPhotoBusy(true);
   try{await savePhotoOriginal(contactPhotoFile,"contacts",row.id);}
   catch(error){setFormError("Photo non enregistrée : "+error.message+". Choisis une autre photo ou retire-la pour conserver la fiche sans photo.");return;}
   finally{contactPhotoSavingRef.current=false;setContactPhotoBusy(false);}
   setPhotoRefreshRevision(value=>value+1);
  }
  setFormError("");
  setData(d=>({...d,[tab]:editingId?(d[tab]||[]).map(existing=>existing.id===editingId?withRecordEventId({...existing,values:row.values,...(tab==="contacts"?details:{})},tab!=="events"?recordEventId:""):existing):[...(d[tab]||[]),row]}));
  setEditingId(null);setForm(["","",""]);setRecordEventId(moduleScopeEventId);setContactEmail("");setContactPhone("");setContactPhotoFile(null);
  if(tab==="contacts")setContactFormOpen(false);
  if(tab==="equipment")setEquipmentFormOpen(false);
  if(tab!=="contacts"&&tab!=="equipment")setModuleFormOpen(false);
  if(tab==="contacts"&&returnToVolunteerEventId&&row.values[1].normalize("NFC").toLocaleLowerCase("fr")==="bénévole"){
   const eventId=returnToVolunteerEventId;
   setReturnToVolunteerEventId("");setTab("shifts");setModuleScopeEventId(eventId);setRecordEventId(eventId);
   setForm([row.values[0],"",""]);setModuleFormOpen(true);setFilter("");
   window.requestAnimationFrame(()=>moduleFormRef.current?.scrollIntoView({behavior:"smooth",block:"start"}));
  }else setReturnToVolunteerEventId("");
 }
 function beginEdit(record){if(demoReadOnly||!allowDiscardDraft())return;setEditingId(record.id);setForm([...record.values]);setContactEmail(record.email||"");setContactPhone(record.phone||"");setContactPhotoFile(null);setReturnToVolunteerEventId("");setRecordEventId(record.eventId||"");setFormError("");if(tab==="contacts")setContactFormOpen(true);else if(tab==="equipment")setEquipmentFormOpen(true);else setModuleFormOpen(true);window.requestAnimationFrame(()=>{const target=tab==="contacts"?contactFormRef.current:tab==="equipment"?equipmentFormRef.current:moduleFormRef.current;target?.scrollIntoView({behavior:"smooth",block:"start"});target?.querySelector('input')?.focus({preventScroll:true});});}
 function cancelEdit(skipConfirmation=false){if(!skipConfirmation&&!allowDiscardDraft())return;setEditingId(null);setForm(["","",""]);setContactEmail("");setContactPhone("");setContactPhotoFile(null);setReturnToVolunteerEventId("");setRecordEventId(moduleScopeEventId);setFormError("");if(tab==="contacts")setContactFormOpen(false);if(tab==="equipment")setEquipmentFormOpen(false);if(tab!=="contacts"&&tab!=="equipment")setModuleFormOpen(false);}
 function openModule(key,eventId=""){
  if(!allowDiscardDraft())return false;
  setReportOpen(false);setReportDraftDirty(false);
  setOrgTodosOpen(false);
  setSettingsOpen(false);
  if(moduleWorkbenchRef.current)moduleWorkbenchRef.current.open=true;
  if(eventId)setHubEventId(eventId);
  setModuleScopeEventId(eventId);
  setTab(key);setRecipeOutput("");setContactType("tous");setEditingId(null);
  setContactFormOpen(false);setContactSearchOpen(false);
  setContactPhotoFile(null);setReturnToVolunteerEventId("");
  setEquipmentFormOpen(false);setEquipmentSearchOpen(false);
  setModuleFormOpen(false);setModuleSearchOpen(false);
  setRecordEventId(eventId);setForm(["","",""]);setContactEmail("");setContactPhone("");
  setFilter("");setFormError("");
  window.requestAnimationFrame(()=>{
   modulePanelRef.current?.focus({preventScroll:true});
   modulePanelRef.current?.scrollIntoView({behavior:"smooth",block:"start"});
  });
  return true;
 }
 function openDriveLibrary(){
  if(!allowDiscardDraft())return;
  setOrgTodosOpen(false);setSettingsOpen(true);
  if(moduleWorkbenchRef.current)moduleWorkbenchRef.current.open=false;
  window.requestAnimationFrame(()=>{
   if(advancedRef.current)advancedRef.current.open=true;
   window.requestAnimationFrame(()=>{
    document.getElementById('drive-library')?.scrollIntoView({behavior:'smooth',block:'start'});
    document.querySelector('#drive-library input[type="search"]')?.focus({preventScroll:true});
   });
  });
 }
 function openRecipeCalculator(recipe){
  setSelectedRecipeId(recipe.id);setRecipeOutput("");
  if(recipeCalculatorRef.current)recipeCalculatorRef.current.open=true;
  window.requestAnimationFrame(()=>recipeCalculatorRef.current?.scrollIntoView({behavior:'smooth',block:'start'}));
 }
 function remove(id){if(demoReadOnly||!allowDiscardDraft())return;if(!confirm("Supprimer cette fiche ?"))return;if(editingId===id)cancelEdit(true);setData(d=>({...d,[tab]:(d[tab]||[]).filter(r=>r.id!==id)}))}
 function updateFestival(id,values){
  if(demoReadOnly)throw new Error('Les fiches locales sont protégées en lecture seule.');
  const updated=updateEventDetails(data.events||[],id,values).find(event=>event.id===id);
  setData(old=>({...old,events:(old.events||[]).map(event=>event.id===id?updated:event)}));
 }
 function createHistoricalEdition(base,year){
  if(demoReadOnly)throw new Error('Les fiches locales sont protégées en lecture seule.');
  const row=createFestivalEdition(data.events||[],base,year,crypto.randomUUID());
  setData(old=>({...old,events:[...(old.events||[]),row]}));
  return row;
 }
 function addRecipeDrafts(){
  if(demoReadOnly){setRecipeDraftStatus("Lecture seule : fiches locales protégées.");return;}
  const result=addMissingRecipeDrafts(data.recipes||[]);
  if(result.added)setData(old=>({...old,recipes:addMissingRecipeDrafts(old.recipes||[]).recipes}));
  setRecipeDraftStatus(result.added?result.added+" brouillon(s) créé(s). Complétez-les avec les originaux du comité.":"Les deux fiches existent déjà. Aucune donnée modifiée.");
 }
 function preparePostDraft(){
  if(!allowDiscardDraft())return;
  try{
   const event=eventOptions.find(r=>r.id===recordEventId)||eventOptions.find(r=>r.values[0]===overviewEvent);
   if(!event)throw new Error("Choisissez d'abord une manifestation.");
   const draft=createEventPostDraft({name:event.values[0],date:event.values[1],place:event.values[2],kind:postKind,tone:postTone});
   setForm([draft.title,draft.body,"À relire"]);setRecordEventId(event.id);setEditingId(null);setModuleFormOpen(true);
   setPostStatus("Brouillon proposé. Vérifiez les dates, les horaires et le contenu avant de le copier sur Facebook.");
  }catch(err){setPostStatus("⚠ "+err.message);}
 }
 async function copyPostDraft(){
  if(!form[1].trim())return;
  try{await navigator.clipboard.writeText(form[1]);setPostStatus("Texte copié. Vous pouvez le coller dans Facebook après relecture.");}
  catch{setPostStatus("Copie impossible sur cet appareil. Sélectionnez le texte puis copiez-le manuellement.");}
 }
 function toggleTaskDone(id){if(demoReadOnly)return;setData(d=>({...d,tasks:(d.tasks||[]).map(r=>r.id===id?{...r,done:!r.done}:r)}));}
 function addQuickTodo(values){
  if(demoReadOnly)throw new Error('Mode lecture seule : les fiches sont protégées.');
  const todo=createTodo({...values,id:crypto.randomUUID()});
  setData(d=>({...d,tasks:[...(d.tasks||[]),todo]}));
  return true;
 }
 function addChecklistToEvent(event){
  if(demoReadOnly)return '⚠ Mode lecture seule.';
  const templateName=event.values[0].replace(/\s+20\d{2}$/,'');
  const drafts=DRIVE_CHECKLISTS[templateName]?suggestDriveChecklistTasks(templateName,event.id,data.tasks||[]):suggestChecklistTasks(event.values[0],event.id,data.tasks||[]);
  if(!drafts.length)return '✅ Les tâches du modèle sont déjà présentes.';
  setData(current=>{
   const fresh=DRIVE_CHECKLISTS[templateName]?suggestDriveChecklistTasks(templateName,event.id,current.tasks||[]):suggestChecklistTasks(event.values[0],event.id,current.tasks||[]);
   return {...current,tasks:[...(current.tasks||[]),...fresh.map(row=>({...row,id:crypto.randomUUID()}))]};
  });
  return `✅ ${drafts.length} tâche(s) ajoutée(s), toutes non cochées.`;
 }
 function selectManifestation(id){
  if(!allowDiscardDraft())return false;
  const event=eventOptions.find(row=>row.id===id);
  setHubEventId(id);setTillOpen(false);setTillCart({});setTillEdit(false);setTillSaleStatus("");
  setReportOpen(false);setReportDraftDirty(false);
  if(event)setTillEvent(event.values[0].replace(/\s+20\d{2}$/,''));
  return true;
 }
 function goToHome(){if(!selectManifestation(''))return;setOrgTodosOpen(false);setSettingsOpen(false);setModuleScopeEventId('');if(moduleWorkbenchRef.current)moduleWorkbenchRef.current.open=false;window.requestAnimationFrame(()=>document.querySelector('[aria-label="Accueil des manifestations"]')?.scrollIntoView({behavior:'smooth',block:'start'}));}
 function openSettings(){if(!allowDiscardDraft())return;setOrgTodosOpen(false);setTillOpen(false);setReportOpen(false);setReportDraftDirty(false);setSettingsOpen(true);if(moduleWorkbenchRef.current)moduleWorkbenchRef.current.open=false;window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:'smooth'}));}
 function applyCloudSnapshot(snapshot){
  if(!allowDiscardDraft())throw new Error('Saisie non enregistrée : restauration annulée.');
  if(demoReadOnly||initialTillConfig.warning)throw new Error('Données locales illisibles : restauration cloud interdite.');
  const clean=persistCloudSnapshot(localStorage,snapshot);
  setData(clean.data);setVolunteerNeeds(clean.volunteerNeeds);setEcocupSettings(clean.ecocupSettings);setTillConfig(clean.tillConfig);
  setTillCart({});setEditingId(null);setForm(['','','']);setRecordEventId('');setNeedsWarning('');
 }
 function openOwnerSetup(){setSettingsOpen(true);window.requestAnimationFrame(()=>{if(advancedRef.current)advancedRef.current.open=true;ownerSetupRef.current?.scrollIntoView({behavior:'smooth',block:'start'});});}
 function openTillForEvent(event){
  if(!event||event.id!==hubEventId||!allowDiscardDraft())return;
  const nextOpen=!tillOpen;
  setReportOpen(false);setReportDraftDirty(false);
  setTillEvent(event.values[0].replace(/\s+20\d{2}$/,''));
  setTillOpen(nextOpen);setOrgTodosOpen(false);
  if(nextOpen)window.requestAnimationFrame(()=>document.querySelector('[aria-label="Caisse tactile"]')?.scrollIntoView({behavior:'smooth',block:'start'}));
 }
 function openReportForEvent(event){
  if(!event||event.id!==hubEventId||!allowDiscardDraft())return;
  setTillOpen(false);setOrgTodosOpen(false);setReportOpen(true);
  window.requestAnimationFrame(()=>document.getElementById('festapp-event-report')?.scrollIntoView({behavior:'smooth',block:'start'}));
 }
 function appendReportRecord(category,row){
  if(demoReadOnly)throw new Error('Les données locales sont protégées en lecture seule.');
  if(!eventOptions.some(event=>event.id===row.eventId))throw new Error('Manifestation introuvable.');
  const next={...data,[category]:[...(data[category]||[]),row]};
  const result=writeDemoStorage(localStorage,next);
  if(!result.saved)throw new Error('Enregistrement impossible sur cet appareil. Rien n’a été ajouté ; vérifie l’espace disponible.');
  setData(next);
 }
 function addReportNote(values){appendReportRecord('feedback',createReportNote({id:crypto.randomUUID(),eventId:hubEventId,...values}));}
 function addReportExpense(values){appendReportRecord('finance',createPendingReportExpense({id:crypto.randomUUID(),eventId:hubEventId,...values}));}
 function updateTillCart(updater){setTillSaleStatus("");setTillCart(updater);recordingTillSaleRef.current=false;}
 function recordTillSale(method){
  if(recordingTillSaleRef.current)return;
  recordingTillSaleRef.current=true;
  try{
   if(demoReadOnly)throw new Error("Données locales protégées en lecture seule.");
   const receipt=createTillFinanceRecord({id:crypto.randomUUID(),eventId:hubEventId,cart:tillCart,products:tillProducts,method,at:new Date().toISOString()});
   const next={...data,finance:[...(data.finance||[]),receipt]};
   const stored=writeDemoStorage(localStorage,next);
   if(!stored.saved)throw new Error("Impossible de sauvegarder sur cet appareil. Le panier a été conservé : réessayez après avoir vérifié le stockage.");
   setData(next);setTillCart({});setTillSaleStatus("✅ Vente notée dans le bilan financier de cette manifestation. Paiement non effectué par FEST’APP.");
  }catch(error){setTillSaleStatus("⚠ "+error.message);}
  finally{recordingTillSaleRef.current=false;}
 }
 function cancelTillSale(saleId){
  if(recordingTillSaleRef.current)return;
  try{
   if(demoReadOnly)throw new Error("Données locales protégées en lecture seule.");
   const correction=createTillCorrectionRecord({id:crypto.randomUUID(),eventId:hubEventId,saleId,finance:data.finance||[],at:new Date().toISOString()});
   if(!window.confirm("Annuler cette vente de "+correction.values[1].slice(1).replace('.',',')+" € ? Une écriture négative sera ajoutée au bilan sans effacer la vente initiale."))return;
   recordingTillSaleRef.current=true;
   const next={...data,finance:[...(data.finance||[]),correction]};
   const stored=writeDemoStorage(localStorage,next);
   if(!stored.saved)throw new Error("Sauvegarde impossible : la vente n'a pas été annulée. Vérifie l'espace disponible.");
   setData(next);setTillSaleStatus("✅ Vente annulée : l'écriture d'origine et sa correction restent dans le bilan.");
  }catch(error){setTillSaleStatus("⚠ "+error.message);}
  finally{recordingTillSaleRef.current=false;}
 }
 function downloadVolunteerNeeds(){const blob=new Blob([exportVolunteerNeeds(volunteerNeeds)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="festapp-besoins-benevoles.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function uploadVolunteerNeeds(e){const file=e.target.files?.[0];e.target.value="";if(!file)return;try{if(demoReadOnly)throw new Error("Mode lecture seule.");if(file.size>1_000_000)throw new Error("Fichier trop volumineux.");const parsed=importVolunteerNeeds(await file.text());if(!window.confirm("Remplacer les besoins bénévoles enregistrés sur cet appareil ? Les affectations existantes ne seront pas modifiées."))return;localStorage.setItem(VOLUNTEER_NEEDS_KEY,JSON.stringify(parsed));setVolunteerNeeds(parsed);setNeedsWarning("Besoins importés sur cet appareil.");}catch(err){setNeedsWarning("⚠ Import refusé : "+err.message);}}
 function exportMenus(){const blob=new Blob([exportTillConfig(tillConfig)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="festapp-menus-caisse.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function importMenus(e){const file=e.target.files?.[0];e.target.value="";if(!file)return;try{if(file.size>100000)throw new Error("Fichier trop volumineux");const parsed=importTillConfig(await file.text());if(!window.confirm("Remplacer les menus personnalisés de cet appareil ?"))return;saveTillConfig(localStorage,parsed);setTillConfig(parsed);setTillCart({});setTillEdit(false);setTillConfigWarning("Menus importés sur cet appareil uniquement.")}catch(err){setTillConfigWarning("⚠ Import refusé : "+err.message)}}
 function openTillEditor(){setTillDraft(TILL_PRODUCTS.map(p=>({id:p.id,enabled:tillProducts.some(x=>x.id===p.id),price:String((tillProducts.find(x=>x.id===p.id)||p).priceCents/100).replace(".",",")})));setTillEdit(true)}
 function saveTillEditor(){try{if(initialTillConfig.warning)throw new Error("Réglages locaux illisibles");const chosen=tillDraft.filter(p=>p.enabled).map(p=>{const price=p.price.trim();if(!/^(0|[1-9]\\d*)(?:[,.]\\d{1,2})?$/.test(price))throw new Error("Prix invalide : "+p.id);const cents=Math.round(Number(price.replace(",","."))*100);if(!Number.isSafeInteger(cents)||cents>100000)throw new Error("Prix hors limite");return {id:p.id,priceCents:cents}});const next={...tillConfig,[tillEvent]:chosen};saveTillConfig(localStorage,next);setTillConfig(next);setTillCart({});setTillEdit(false);setTillConfigWarning("Menu enregistré uniquement sur cet appareil.")}catch(e){setTillConfigWarning("⚠ "+e.message)}}
 function exportBackup(){if(demoReadOnly){setBackupPreview("⚠ Sauvegarde bloquée : une partie des données locales est illisible. Ne supprimez pas les données de cet appareil.");return;}try{const json=createCombinedDemoBackup(data,volunteerNeeds,undefined,ecocupSettings);const url=URL.createObjectURL(new Blob([json],{type:"application/json"}));const a=document.createElement("a");a.href=url;a.download="festapp-demo-sauvegarde-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch{setBackupPreview("⚠ Téléchargement impossible : la sauvegarde est trop volumineuse ou contient des données invalides. Aucune fiche n’a été effacée.")}}
 async function exportFullBackup(){
  if(demoReadOnly)throw new Error('Données locales illisibles : ne quittez pas cet appareil et ne supprimez rien.');
  const backupJSON=createCombinedDemoBackup(data,volunteerNeeds,undefined,ecocupSettings);
  const menuJSON=exportTillConfig(tillConfig);
  const reviewJSON=JSON.stringify({format:'festapp-owner-review',version:1,reviews:parseOwnerReviews(localStorage.getItem(OWNER_REVIEW_KEY))},null,2);
  const photos=await listAllPhotoOriginals();
  const zip=await makeCompleteBackupZip({backupJSON,menuJSON,reviewJSON,photos});
  const url=URL.createObjectURL(zip);
  const a=document.createElement('a');a.href=url;a.download='festapp-sauvegarde-complete-'+new Date().toISOString().slice(0,10)+'.zip';a.click();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
  return `✅ ZIP préparé : ${Object.values(data).reduce((n,rows)=>n+(Array.isArray(rows)?rows.length:0),0)} fiche(s), ${photos.length} photo(s), menus et vérifications. Conservez-le hors du navigateur.`;
 }
 async function inspectFullZip(e){
  const file=e.target.files?.[0];e.target.value='';
  setFullZipCandidate(null);
  if(!file||fullZipBusy)return;
  if(demoReadOnly){setFullZipPreview('⚠ Données locales illisibles : restauration désactivée.');return;}
  setFullZipBusy(true);setFullZipPreview('Analyse privée du ZIP et vérification de toutes les photos…');
  try{
   const archive=await readCompleteBackupZip(file);
   const existingPhotos=await listAllPhotoOriginals();
   const localReviews=parseOwnerReviews(localStorage.getItem(OWNER_REVIEW_KEY));
   const plan=await planCompleteZipRestore(archive,data,{volunteerNeeds,ecocupSettings,tillConfig,reviews:localReviews,photos:existingPhotos});
   const hasUpdates=plan.addedRecords>0||plan.addedPhotos>0||JSON.stringify(plan.nextNeeds)!==JSON.stringify(volunteerNeeds)||JSON.stringify(plan.nextEcocups)!==JSON.stringify(ecocupSettings)||JSON.stringify(plan.nextMenus)!==JSON.stringify(tillConfig)||JSON.stringify(plan.nextReviews)!==JSON.stringify(localReviews);
   const explanation=`ZIP contrôlé : ${plan.addedRecords} fiche(s) à ajouter, ${plan.unchangedRecords} déjà identique(s), ${plan.addedPhotos} photo(s) à restaurer, ${plan.unchangedPhotos} déjà présente(s). Menus, besoins bénévoles, réglages écocups et vérifications examinés.`;
   if(!plan.safe){setFullZipPreview('⚠ '+explanation+' Restauration bloquée : '+plan.conflicts.slice(0,4).join(' ; ')+'. Aucun changement.');return;}
   if(!hasUpdates){setFullZipPreview('✅ '+explanation+' Tout est déjà à jour, rien à restaurer.');return;}
   setFullZipCandidate({plan,snapshot:JSON.stringify([data,volunteerNeeds,ecocupSettings,tillConfig,localReviews]),photoIds:existingPhotos.map(p=>p.id).sort().join('|')});
   setFullZipPreview('✅ '+explanation+' Aucun changement pour le moment. Tu peux confirmer l’ajout des éléments manquants ; les fiches différentes existantes ne seront jamais écrasées.');
  }catch(error){setFullZipPreview('⚠ Import ZIP refusé : '+(error.message||'fichier incompatible')+' Aucune donnée modifiée.');}
  finally{setFullZipBusy(false);}
 }
 async function confirmFullZip(){
  if(demoReadOnly||fullZipBusy||!fullZipCandidate?.plan?.safe)return;
  const {plan,snapshot,photoIds}=fullZipCandidate;
  const currentReviews=parseOwnerReviews(localStorage.getItem(OWNER_REVIEW_KEY));
  if(snapshot!==JSON.stringify([data,volunteerNeeds,ecocupSettings,tillConfig,currentReviews])){setFullZipCandidate(null);setFullZipPreview('⚠ Des fiches ou des réglages ont changé : rechoisis ton ZIP pour une nouvelle vérification.');return;}
  setFullZipBusy(true);
  try{
   const photos=await listAllPhotoOriginals();
   if(photoIds!==photos.map(p=>p.id).sort().join('|'))throw new Error('La photothèque a changé : rechoisis ton ZIP.');
   if(!window.confirm(`Confirmer l’ajout de ${plan.addedRecords} fiche(s) et ${plan.addedPhotos} photo(s), ainsi que les réglages manquants de ce ZIP ? Aucun contenu déjà présent ne sera remplacé. Conserve toujours le ZIP original.`))return;
   let ids=[];
   try{
    ids=await saveRestoredPhotoOriginals(plan.addPhotos);
    persistCompleteZipRestore(localStorage,plan);
   }catch(error){
    let rollbackFailed=false;
    try{await rollbackRestoredPhotoOriginals(ids);}catch{rollbackFailed=true;}
    throw new Error(error.message+(rollbackFailed?' ⚠ Certaines photos ont peut-être été ajoutées : vérifie la photothèque.':''));
   }
   const restoredData=plan.nextData;
   setData(restoredData);setVolunteerNeeds(plan.nextNeeds);setEcocupSettings(plan.nextEcocups);setTillConfig(plan.nextMenus);setTillCart({});
   setPhotoRefreshRevision(r=>r+1);setReviewRestoreRevision(r=>r+1);setStorageWarning('');
   setFullZipCandidate(null);
   setFullZipPreview(`✅ Restauration effectuée sur cet appareil : ${plan.addedRecords} fiche(s), ${plan.addedPhotos} photo(s), et réglages compatibles. Rien n’a été envoyé ni partagé. Garde le ZIP original.`);
  }catch(error){setFullZipCandidate(null);setFullZipPreview('⚠ Restauration non terminée : '+(error.message||'stockage indisponible')+' Conserve ton ZIP et vérifie les données de cet appareil avant un nouvel essai.');}
  finally{setFullZipBusy(false);}
 }
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
 function exportCsv(category,contactKind="tous"){
  const selected=categories.find(item=>item.key===category);
  if(!selected)return;
  const rows=category==="contacts"
   ?selectContactsWithDetailsForExport(data.contacts||[],contactKind,"")
   :(data[category]||[]).map(r=>r.values);
  const csv=buildCsv(category==="contacts"?CONTACT_EXPORT_COLUMNS:selected.fields,rows);
  const a=document.createElement("a");
  const url=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));
  a.href=url;
  a.download="festapp-"+category+(category==="contacts"&&contactKind!=="tous"?"-"+contactKind:"")+".csv";
  a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function downloadCompleteExport(){
  setExportStatus("Préparation du fichier complet…");
  try{setExportStatus(await exportFullBackup());}
  catch(error){setExportStatus("⚠ Export impossible : "+(error.message||"données à vérifier")+". Rien n’a été supprimé.");}
 }
 function toggleContactSearch(){
  if(contactSearchOpen){setContactSearchOpen(false);setFilter("");return;}
  setContactSearchOpen(true);
  window.requestAnimationFrame(()=>contactSearchRef.current?.focus());
 }
 function openContactForm(){
  if(demoReadOnly||!allowDiscardDraft())return;
  setEditingId(null);setForm(["","",""]);setContactEmail("");setContactPhone("");setContactPhotoFile(null);setReturnToVolunteerEventId("");setFormError("");setContactFormOpen(true);
  window.requestAnimationFrame(()=>{contactFormRef.current?.scrollIntoView({behavior:"smooth",block:"start"});contactFormRef.current?.querySelector('input')?.focus({preventScroll:true});});
 }
 function chooseVolunteerForEvent(person){
  if(demoReadOnly||!allowDiscardDraft())return;
  setEditingId(null);setForm([person.name,"",""]);setRecordEventId(moduleScopeEventId);setFormError("");setModuleFormOpen(true);
  window.requestAnimationFrame(()=>{moduleFormRef.current?.scrollIntoView({behavior:"smooth",block:"start"});moduleFormRef.current?.querySelector('input[placeholder="Créneau"]')?.focus({preventScroll:true});});
 }
 function openNewVolunteerForEvent(){
  if(demoReadOnly||!moduleScopeEventId)return;
  const eventId=moduleScopeEventId;
  if(openModule("contacts")===false)return;
  setReturnToVolunteerEventId(eventId);setContactType("bénévole");setForm(["","bénévole",""]);setContactFormOpen(true);
  window.requestAnimationFrame(()=>{contactFormRef.current?.scrollIntoView({behavior:"smooth",block:"start"});contactFormRef.current?.querySelector('input')?.focus({preventScroll:true});});
 }
 function chooseContactPhoto(event){
  const file=event.target.files?.[0];event.target.value="";
  if(!file||demoReadOnly||contactPhotoSavingRef.current)return;
  try{validatePhotoInput(file,"contacts");setContactPhotoFile(file);setFormError("");}
  catch(error){setFormError(error.message||"Photo invalide.");}
 }
 function openEquipmentForm(){
  if(demoReadOnly||!allowDiscardDraft())return;
  setEditingId(null);setForm(["","",""]);setRecordEventId(moduleScopeEventId);setFormError("");setEquipmentFormOpen(true);
  window.requestAnimationFrame(()=>{equipmentFormRef.current?.scrollIntoView({behavior:"smooth",block:"start"});equipmentFormRef.current?.querySelector('input')?.focus({preventScroll:true});});
 }
 function toggleEquipmentSearch(){
  if(equipmentSearchOpen){setEquipmentSearchOpen(false);setFilter("");return;}
  setEquipmentSearchOpen(true);
  window.requestAnimationFrame(()=>equipmentSearchRef.current?.focus());
 }
 function openModuleForm(){
  if(demoReadOnly||!allowDiscardDraft())return;
  setEditingId(null);setForm(["","",""]);setFormError("");setRecordEventId(moduleScopeEventId);setModuleFormOpen(true);
  window.requestAnimationFrame(()=>{moduleFormRef.current?.scrollIntoView({behavior:"smooth",block:"start"});moduleFormRef.current?.querySelector('input')?.focus({preventScroll:true});});
 }
 function toggleModuleSearch(){
  if(moduleSearchOpen){setModuleSearchOpen(false);setFilter("");return;}
  setModuleSearchOpen(true);
  window.requestAnimationFrame(()=>moduleSearchRef.current?.focus());
 }
 return <main>
 <header><div>🎆 FEST'APP <small>Comité des fêtes de Liernais</small></div><span className="demo">Mode démonstration</span></header>
 {storageWarning&&<p role="alert" className="note">⚠ {storageWarning}</p>}
 {initialNeedsStorage.warning&&<p role="alert" className="note">⚠ {initialNeedsStorage.warning}</p>}
 {initialEcocupStorage.warning&&<p role="alert" className="note">⚠ {initialEcocupStorage.warning}</p>}
 {!settingsOpen&&<>
  <ManifestationHub events={eventOptions} tasks={data.tasks||[]} selectedId={hubEventId} onSelect={selectManifestation} onBack={()=>selectManifestation('')} onOpenModule={openModule} onOpenTill={openTillForEvent} onOpenReport={openReportForEvent} tillOpen={tillOpen||reportOpen} onToggleTodo={toggleTaskDone} onAddTodo={addQuickTodo} onChecklist={addChecklistToEvent} readOnly={demoReadOnly} photoRevision={photoRefreshRevision}/>
  {activeManifestation&&reportOpen&&<EventReport key={activeManifestation.id} eventId={activeManifestation.id} data={data} readOnly={demoReadOnly} onAddNote={addReportNote} onAddExpense={addReportExpense} onDraftChange={setReportDraftDirty} onClose={()=>{if(!allowDiscardDraft())return;setReportOpen(false);setReportDraftDirty(false);}}/>}
  {activeManifestation&&tillOpen&&<EventTill eventName={activeManifestation.values[0]} onClose={()=>openTillForEvent(activeManifestation)} products={tillProducts} cart={tillCart} setCart={updateTillCart} onRecordSale={recordTillSale} onCancelSale={cancelTillSale} saleStatus={tillSaleStatus} saleSummary={tillSaleSummary} saleHistory={tillSaleHistory} readOnly={demoReadOnly} editing={tillEdit} onToggleEdit={()=>tillEdit?setTillEdit(false):openTillEditor()} draft={tillDraft} setDraft={setTillDraft} onSave={saveTillEditor} configWarning={tillConfigWarning} configReadOnly={!!initialTillConfig.warning} onImport={()=>tillImportRef.current?.click()} importRef={tillImportRef} onImportFile={importMenus}/>}
 </>}
 {settingsOpen&&<>
 <section className="festapp-settings-head"><button type="button" className="festapp-back-action" onClick={()=>setSettingsOpen(false)}>← Retour aux fêtes</button><h1>⚙ Plus et réglages</h1><p>Sauvegardes, documents et outils de gestion.</p><button type="button" onClick={openOwnerSetup}>✍️ Vérifier les fiches avant de les partager</button></section>
 <FestivalSettings events={eventOptions} finance={data.finance||[]} archives={data.archives||[]} driveCatalog={driveCatalog} readOnly={demoReadOnly} onUpdate={updateFestival} onCreateEdition={createHistoricalEdition} onOpenFinance={eventId=>openModule('finance',eventId)} onOpenDrive={openDriveLibrary}/>
 <section className="festapp-export-center" aria-label="Exports de FEST'APP">
  <h2>📤 Exports</h2>
  <p>Retrouve ici tous les téléchargements, quand tu en as besoin.</p>
  <button type="button" className="festapp-export-complete" onClick={downloadCompleteExport} disabled={demoReadOnly}>📦 Tout exporter (ZIP)</button>
  <small>Fiches, photos, menus et réglages enregistrés sur cet appareil.</small>
  {exportStatus&&<p role="status" className="festapp-export-status">{exportStatus}</p>}
  <div className="festapp-export-select">
   <label>Exporter une rubrique en CSV<select value={exportCategory} onChange={e=>setExportCategory(e.target.value)}>{categories.map(item=><option key={item.key} value={item.key}>{item.icon} {item.title}</option>)}</select></label>
   {exportCategory==="contacts"&&<label>Contacts à exporter<select value={exportContactType} onChange={e=>setExportContactType(e.target.value)}><option value="tous">Tous les contacts</option><option value="bénévole">Bénévoles</option><option value="exposant">Exposants</option><option value="groupe">Groupes</option><option value="fournisseur">Fournisseurs</option><option value="intervenant">Intervenants</option></select></label>}
   <button type="button" className="secondary" onClick={()=>exportCsv(exportCategory,exportContactType)}>📄 Télécharger CSV</button>
  </div>
  <details className="festapp-export-extras"><summary>Autres exports</summary><div className="festapp-export-extra-actions"><button type="button" className="secondary" onClick={downloadVolunteerNeeds}>Besoins bénévoles (JSON)</button><button type="button" className="secondary" onClick={exportMenus}>Menus de caisse (JSON)</button></div></details>
  <p className="festapp-export-privacy">Ces fichiers proviennent de cet appareil uniquement. Vérifie leurs destinataires avant de partager les coordonnées des contacts.</p>
 </section>
 <details className="festapp-sync-settings"><summary>☁️ Sauvegarde et synchronisation <span>Facultatif</span></summary>
  <p className="note">Les saisies restent sur cet appareil tant que la synchronisation n’est pas activée et vérifiée.</p>
  <SharedAccess data={data} volunteerNeeds={volunteerNeeds} ecocupSettings={ecocupSettings} tillConfig={tillConfig} onApplyRemote={applyCloudSnapshot} readOnly={demoReadOnly||!!initialTillConfig.warning}/>
 </details>
 <details className="festapp-advanced" ref={advancedRef}><summary>🔧 Préparation privée, archives du Drive et sauvegardes</summary>
 <section className="quick-access" aria-label="Accès rapide aux modules">
  <div className="quick-access-title"><h2>⚡ Accès rapide</h2><span>Choisissez votre activité</span></div>
  <div className="quick-access-grid">
   {[
    ["events","🎉","Manifestations",(data.events||[]).length+" fiches"],
    ["tasks","✅","Tâches",(data.tasks||[]).filter(r=>r.done!==true).length+" à faire"],
    ["contacts","👥","Annuaire",(data.contacts||[]).length+" contacts"],
    ["ecocups","🥤","Écocups",ecocupSummary?(ecocupSummary.alert?"⚠ Seuil atteint · ":"Stock · ")+ecocupSummary.balance:"Stock à vérifier"],
    ["shifts","🕒","Bénévoles",(data.shifts||[]).length+" affectations"],
    ["recipes","🍲","Recettes",(data.recipes||[]).length+" recettes"],
    ["shopping","🛒","Achats",(data.shopping||[]).length+" articles"],
    ["stock","📦","Stock",(data.stock||[]).length+" fiches"],
    ["feedback","📝","Retours",(data.feedback||[]).length+" retours"],
    ["finance","📊","Finances",(data.finance||[]).length+" écritures"],
    ["equipment","🧰","Matériel",(data.equipment||[]).length+" fiches"],
    ["posts","📣","Communication",(data.posts||[]).length+" publications"],
    ["archives","🗂️","Archives",(data.archives||[]).length+" souvenirs"]
   ].map(([key,icon,title,details])=><button type="button" key={key} className="quick-access-tile" aria-label={title+" : "+details} onClick={()=>openModule(key)}><span className="quick-icon" aria-hidden="true">{icon}</span><strong>{title}</strong><small>{details}</small></button>)}
  </div>
  <p className="quick-access-note">Chiffres de démonstration de cet appareil uniquement · aucun stock partagé.</p>
 </section>
 <div ref={ownerSetupRef}><OwnerSetup data={data} onOpen={openModule} onBackup={exportBackup} onFullBackup={exportFullBackup} onInspectZip={inspectFullZip} onRestoreZip={confirmFullZip} zipPreview={fullZipPreview} zipCanRestore={!!fullZipCandidate} zipBusy={fullZipBusy} reviewRestoreRevision={reviewRestoreRevision} ecocupSettings={{opening:ecocupOpening,threshold:ecocupThreshold}} readOnly={demoReadOnly}/></div>
 <FreeAiHelper events={eventOptions} recipes={data.recipes||[]}/>
 <DriveBoard catalog={driveCatalog} loading={driveLoading} error={driveError} importStatus={driveImportStatus} onImport={importDriveAgain} readOnly={demoReadOnly}/>
 <section className="event-cockpit" aria-label="Tableau de bord de la manifestation">
  <div className="event-cockpit-heading"><div><h2>🎯 Ma manifestation</h2><p>En un coup d’œil, les priorités pour préparer la fête.</p></div><label>Événement<select value={overviewEvent} onChange={e=>{setOverviewEvent(e.target.value);setChecklistStatus("");}}>{[...new Set([...eventNames,...eventOptions.map(r=>r.values[0])])].map(name=><option key={name} value={name}>{name}</option>)}</select></label></div>
  <div className="event-cockpit-grid">
   {[["tasks","✅",selectedOverview.taskProgress.remaining,"Tâches à faire"],["shopping","🛒",selectedOverview.counts.shopping,"Achats prévus"],["shifts","👥",selectedOverview.counts.shifts,"Affectations"],["stock","📦",selectedOverview.counts.stock,"Fiches stock"]].map(([key,icon,count,label])=><button type="button" key={key} className="event-cockpit-tile" onClick={()=>openModule(key,eventOptions.find(r=>r.values[0]===overviewEvent)?.id||"")}><span aria-hidden="true">{icon}</span><strong>{count}</strong><small>{label}</small></button>)}
  </div>
  <button type="button" className="event-cockpit-action" onClick={()=>document.querySelector('[aria-label="Préparation de manifestation"]')?.scrollIntoView({behavior:"smooth",block:"start"})}>📋 Préparer {overviewEvent}</button>
  <p>Ces indicateurs ne comptent que les fiches associées à cette manifestation. Les données restent sur cet appareil.</p>
 </section>
 <section className="panel" aria-label="Sauvegarde de démonstration"><div className="heading"><h2>💾 Sauvegarde locale</h2><button className="secondary" onClick={exportBackup}>Télécharger JSON</button></div><p>Conservez une copie de vos fiches de démonstration. La vérification d’un fichier ne restaure ni ne remplace aucune donnée.</p><label>Vérifier une sauvegarde JSON<input type="file" accept=".json,application/json" onChange={inspectBackup}/></label>{backupPreview&&<p role="status">{backupPreview}</p>}{restoreCandidate&&!demoReadOnly&&<button type="button" onClick={restoreBackup}>Confirmer l’ajout des fiches manquantes</button>}</section>
 <section className="panel" aria-label="Préparation de manifestation"><div className="heading"><h2>🎉 Préparation de manifestation</h2><span className="demo">Aperçu local</span></div><label>Choisir une manifestation<select value={overviewEvent} onChange={e=>{setOverviewEvent(e.target.value);setChecklistStatus("");}}>{[...new Set([...eventNames,...eventOptions.map(r=>r.values[0])])].map(name=><option key={name} value={name}>{name}</option>)}</select></label><p>Les fiches liées explicitement à cette manifestation sont prioritaires. Les anciennes fiches sans association peuvent être reconnues par un nom identique.</p><div className="note" role="status"><strong>✅ {selectedOverview.taskProgress.done} tâche(s) terminée(s) sur {selectedOverview.taskProgress.total}</strong><p>📋 {selectedOverview.taskProgress.remaining} tâche(s) restent à faire.</p><progress value={selectedOverview.taskProgress.done} max={Math.max(1,selectedOverview.taskProgress.total)} aria-label="Avancement des tâches" style={{width:"100%"}}/></div><button type="button" className="secondary" disabled={demoReadOnly||!eventOptions.some(r=>r.values[0]===overviewEvent)} onClick={()=>{const event=eventOptions.find(r=>r.values[0]===overviewEvent);if(!event)return;const proposals=DRIVE_CHECKLISTS[checklistTemplateName]?suggestDriveChecklistTasks(checklistTemplateName,event.id,data.tasks||[]):suggestChecklistTasks(overviewEvent,event.id,data.tasks||[]);if(!proposals.length){setChecklistStatus("Toutes les tâches proposées sont déjà présentes.");return;}setData(old=>({...old,tasks:[...(old.tasks||[]),...(DRIVE_CHECKLISTS[checklistTemplateName]?suggestDriveChecklistTasks(checklistTemplateName,event.id,old.tasks||[]):suggestChecklistTasks(overviewEvent,event.id,old.tasks||[])).map(r=>({...r,id:crypto.randomUUID()}))]}));setChecklistStatus(proposals.length+" tâche(s) ajoutée(s) à la manifestation.");}}>📋 Ajouter la vraie check-list de préparation</button>{checklistStatus&&<p role="status">{checklistStatus}</p>}<p className="note">{DRIVE_CHECKLISTS[checklistTemplateName]?"Liste issue du Google Drive du comité, classée par étapes.":"Modèle général de préparation."} Ajoute uniquement les tâches manquantes, non cochées, pour cette manifestation. Vous pourrez les attribuer et les compléter dans l’onglet Tâches.</p>{DRIVE_CHECKLISTS[checklistTemplateName]&&eventOptions.some(r=>r.values[0]===overviewEvent)&&<div className="event-phase-list" aria-label="Check-list par étape">{checklistProgress(data.tasks||[],eventOptions.find(r=>r.values[0]===overviewEvent).id,Object.keys(DRIVE_CHECKLISTS[checklistTemplateName].phases)).map(group=><details key={group.phase} className="event-phase"><summary><strong>{group.phase}</strong><span>{group.done} / {group.total} fait(s)</span></summary>{group.total===0?<p>Ajoutez la check-list pour afficher les tâches.</p>:<div className="phase-items">{group.rows.map(task=><label key={task.id} className="phase-item"><input type="checkbox" checked={task.done===true} disabled={demoReadOnly} onChange={()=>toggleTaskDone(task.id)}/><span>{task.values[0]}</span></label>)}</div>}</details>)}</div>}<div className="purchase-assistant"><button type="button" className="secondary" disabled={demoReadOnly||!eventOptions.some(r=>r.values[0]===overviewEvent)} onClick={()=>{const event=eventOptions.find(r=>r.values[0]===overviewEvent);if(!event)return;const proposals=suggestEventPurchases(event.id,data.tasks||[],data.shopping||[]);if(!proposals.length){setChecklistStatus("Aucun nouvel achat détecté dans les tâches de cette manifestation.");return;}if(!window.confirm("Ajouter "+proposals.length+" article(s) à la liste Achats de cette manifestation ? Les quantités resteront à préciser. Aucun achat ni mouvement de stock ne sera effectué."))return;setData(old=>({...old,shopping:[...(old.shopping||[]),...suggestEventPurchases(event.id,old.tasks||[],old.shopping||[]).map(r=>({...r,id:crypto.randomUUID()}))]}));setChecklistStatus(proposals.length+" article(s) ajouté(s) aux Achats, à vérifier.");}}>🛒 Préparer les achats depuis les tâches</button><p className="note">Propose les fournitures repérées dans la check-list (gaz, boissons, pain, écocups…). Quantités à vérifier. Aucun achat automatique.</p></div><details className="event-phase"><summary><strong>📦 Comparer les achats au stock</strong></summary><p className="note">Comparaison indicative des noms et quantités saisis. Aucun stock n’est réservé ou déduit. Vérifier les unités, l’état du matériel et les autres manifestations.</p><div className="stock-summary" role="status">{(()=>{const summary=summarizeStockComparison(compareShoppingWithStock(data.shopping||[],data.stock||[],eventOptions.find(r=>r.values[0]===overviewEvent)?.id||""));return <><div className="stock-summary-tile ok"><strong>{summary.sufficient}</strong><span>Disponibles*</span></div><div className="stock-summary-tile warn"><strong>{summary.shortage}</strong><span>À compléter</span></div><div className="stock-summary-tile unknown"><strong>{summary.verify}</strong><span>À vérifier</span></div></>})()}</div><div className="stock-comparison">{compareShoppingWithStock(data.shopping||[],data.stock||[],eventOptions.find(r=>r.values[0]===overviewEvent)?.id||"").map(item=><div className={"stock-comparison-item "+(item.status==="Stock théoriquement suffisant"?"stock-ok":item.status==="Complément à prévoir"?"stock-warn":"stock-unknown")} key={item.id}><span className="stock-status-icon" aria-hidden="true">{item.status==="Stock théoriquement suffisant"?"✓":item.status==="Complément à prévoir"?"!":"?"}</span><div className="stock-item-content"><strong>{item.name}</strong><span>{item.status}</span><small>Besoin : {item.needed??"?"} · Stock : {item.available??"?"}{item.toBuy!==null?" · À prévoir : "+item.toBuy:""}</small></div></div>)}</div><p className="note">*Disponibles selon les chiffres saisis, sous réserve des unités et des autres utilisations.</p></details><div className="next-edition"><label>Nouvelle édition (année)<input type="number" min="2020" max="2099" value={nextEditionYear} onChange={e=>setNextEditionYear(e.target.value)}/></label><button type="button" className="secondary" disabled={demoReadOnly||!eventOptions.some(r=>r.values[0]===overviewEvent)} onClick={()=>{const source=eventOptions.find(r=>r.values[0]===overviewEvent);if(!source)return;try{const plan=planNextEdition(data.events||[],data.tasks||[],source.id,nextEditionYear);if(!window.confirm("Créer "+plan.eventValues[0]+" avec "+plan.tasks.length+" tâche(s) à refaire ? L’édition actuelle et ses affectations seront conservées."))return;const newId=crypto.randomUUID();setData(old=>({...old,events:[...(old.events||[]),{id:newId,values:plan.eventValues}],tasks:[...(old.tasks||[]),...plan.tasks.map(t=>({...t,id:crypto.randomUUID(),eventId:newId}))]}));setOverviewEvent(plan.eventValues[0]);setChecklistStatus("Édition "+plan.eventValues[0]+" créée. Les anciennes tâches restent intactes.");}catch(err){setChecklistStatus("⚠ "+err.message);}}}>📅 Préparer l’édition suivante</button><p className="note">Crée une nouvelle manifestation avec les tâches remises à faire. Dates et responsables sont à renseigner ; l’historique de l’édition précédente est conservé.</p></div><div className="till-grid">{[["tasks","✅ Tâches"],["shopping","🛒 Achats"],["stock","📦 Stock"],["shifts","🕒 Bénévoles"],["feedback","📝 Retours"],["finance","📊 Finances"]].map(([key,label])=><button type="button" className="till-product" key={key} onClick={()=>openModule(key,eventOptions.find(r=>r.values[0]===overviewEvent)?.id||"")}><strong>{label}</strong><span>{selectedOverview.counts[key]} fiche(s) liée(s)</span><span>Ouvrir le module</span></button>)}</div><p className="note">Aperçu de démonstration uniquement : les fiches non attribuées ne sont pas modifiées.</p></section>
 </details>
 </>}
 <details className="festapp-workbench" ref={moduleWorkbenchRef} data-event-scoped={!!scopeEvent}><summary>← Retour à {activeManifestation?.values[0]||scopeEvent?.values[0]||'l’accueil'}</summary>
 {scopeEvent?<nav className="festapp-event-switcher" aria-label="Changer de rubrique dans cette manifestation">
  {eventModuleShortcuts.map(key=>{const item=categories.find(category=>category.key===key);return <button type="button" key={key} aria-current={tab===key?'page':undefined} className={tab===key?'active':''} onClick={()=>openModule(key,scopeEvent.id)}>{item.icon} {item.title}</button>})}
 </nav>:<details className="festapp-other-modules"><summary>Changer de rubrique</summary><nav aria-label="Modules">{categories.map(c=><button type="button" key={c.key} className={tab===c.key?"active":""} onClick={()=>openModule(c.key)}>{c.icon} {c.title}</button>)}</nav></details>}
 <section className="panel module-panel" ref={modulePanelRef} tabIndex={-1} aria-label={current.title} data-directory={tab==="contacts"}><div className="heading"><h2>{current.icon} {current.title}</h2></div>
 {scopeEvent&&<div className="festapp-module-scope" role="status"><strong>🎉 {scopeEvent.values[0]} · Les nouvelles fiches sont automatiquement rattachées à cette fête.</strong></div>}
 {tab==="shifts"&&scopeEvent&&<VolunteerPhotoPicker volunteers={volunteers} assignments={recordsForManifestation(data.shifts||[],"shifts",scopeEvent.id)} selectedName={moduleFormOpen?form[0]:""} readOnly={demoReadOnly} photoRevision={photoRefreshRevision} onSelect={chooseVolunteerForEvent} onAdd={openNewVolunteerForEvent}/>}
 {tab==="ecocups"&&<div className="note"><p><strong>Calcul local de démonstration uniquement — aucun stock partagé.</strong> Saisir les mouvements exactement sous la forme « entrée » ou « sortie », et une quantité entière positive.</p><div className="fields"><label>Stock initial de démonstration<input inputMode="numeric" disabled={demoReadOnly} value={ecocupOpening} onChange={e=>setEcocupOpening(e.target.value)}/></label><label>Seuil d'alerte<input inputMode="numeric" disabled={demoReadOnly} value={ecocupThreshold} onChange={e=>setEcocupThreshold(e.target.value)}/></label></div>{ecocupError?<p role="alert">⚠ Calcul impossible : {ecocupError}. Vérifiez les mouvements, sans les effacer.</p>:<div className={"ecocup-balance-card "+(ecocupSummary.alert?"ecocup-balance-alert":"ecocup-balance-ok")} role="status"><span className="ecocup-balance-icon" aria-hidden="true">{ecocupSummary.alert?"⚠️":"✅"}</span><div><strong className="ecocup-balance-count">{ecocupSummary.balance} écocups</strong><p>{ecocupSummary.alert?"Seuil atteint : prévoir au moins "+(ecocupSummary.minimumToClearAlert??"une quantité à vérifier")+" écocups supplémentaires.":"Stock de démonstration au-dessus du seuil."}</p><small>Calcul local uniquement · aucune réservation de stock réel</small></div></div>}</div>}
 {tab==="recipes"&&<details className="festapp-optional-tool" ref={recipeCalculatorRef}><summary>🧮 Calculer les quantités</summary><div className="note"><h3>🧮 Calculateur de quantités</h3><p>Les ingrédients doivent être saisis un par ligne (ex. : 250 g farine). Le calcul ne modifie jamais la recette originale.</p><label>Recette à calculer<select value={selectedRecipeId} onChange={e=>{setSelectedRecipeId(e.target.value);setRecipeOutput("");}}><option value="">Choisir une recette</option>{recordsForManifestation(data.recipes||[],"recipes",moduleScopeEventId).map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label><div className="fields"><label>Recette prévue pour<input inputMode="numeric" value={recipeServings} onChange={e=>setRecipeServings(e.target.value)}/></label><label>Nombre de personnes souhaité<input inputMode="numeric" value={recipeTarget} onChange={e=>setRecipeTarget(e.target.value)}/></label></div><button type="button" disabled={!selectedRecipeId} onClick={()=>{try{const recipe=(data.recipes||[]).find(r=>r.id===selectedRecipeId);if(!recipe)throw new Error("Recette introuvable.");setRecipeOutput(scaleRecipeText(recipe.values[1],Number(recipeServings),Number(recipeTarget)))}catch(e){setRecipeOutput("⚠ "+e.message)}}}>Calculer les ingrédients</button>{recipeOutput&&<pre role="status" style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{recipeOutput}</pre>}</div></details>}
 {tab==="recipes"&&<details className="festapp-optional-tool"><summary>📒 Recettes du comité à compléter</summary><div className="recipe-starters"><h3>📒 Recettes originales à vérifier</h3><p>Andouillettes et pâte à crêpes : deux fiches brouillon sont prévues sans ingrédients inventés. Ajoutez les photos originales et renseignez les quantités avant de les utiliser.</p><button type="button" disabled={demoReadOnly} onClick={addRecipeDrafts}>Vérifier les deux brouillons</button>{recipeDraftStatus&&<p role="status">{recipeDraftStatus}</p>}</div></details>}
 {tab==="posts"&&<details className="festapp-optional-tool"><summary>✨ Préparer une publication</summary><div className="post-assistant"><h3>✨ Préparer une publication Facebook</h3><p>Prépare un texte modifiable pour {scopeEvent?.values[0]||'une fête'}. C’est un <strong>brouillon local, sans IA connectée</strong> et sans publication automatique.</p><div className="post-controls"><label>Type<select value={postKind} onChange={e=>setPostKind(e.target.value)}><option value="annonce">Annoncer une fête</option><option value="rappel">Faire un rappel</option><option value="remerciement">Remercier après l’événement</option></select></label><label>Ton<select value={postTone} onChange={e=>setPostTone(e.target.value)}><option value="chaleureux">Chaleureux</option><option value="dynamique">Dynamique</option></select></label></div><button type="button" onClick={preparePostDraft}>✨ Préparer mon texte</button><button type="button" className="secondary" disabled={!form[1]} onClick={copyPostDraft}>📋 Copier le texte</button>{postStatus&&<p role="status">{postStatus}</p>}</div></details>}
 {tab==="equipment"&&<p className="festapp-equipment-hint">Touche un matériel pour voir sa fiche, modifier sa quantité ou ajouter sa photo.</p>}
 {tab==="archives"&&<p className="note">🗂️ Les documents d’origine restent dans le Drive. {driveCatalog?<a href="#drive-library" className="archive-drive-link" onClick={event=>{event.preventDefault();openDriveLibrary();}}>🔎 Rechercher parmi les {driveCatalog.files.length} documents du comité</a>:<a href={DRIVE_FOLDERS[0].url} className="archive-drive-link" target="_blank" rel="noopener noreferrer">📁 Ouvrir les dossiers des manifestations dans Google Drive</a>}. Vous pouvez aussi ajouter vos souvenirs et photos locales ci-dessous.</p>}
 {tab==="finance"&&<p className="note">🧾 Vous pouvez photographier les justificatifs en bas de cette rubrique, en gardant leur original sur cet appareil. La photo n’inscrit aucun montant automatiquement : saisissez puis contrôlez l’écriture ci-dessous.</p>}
 {tab==="contacts"&&<div className="festapp-directory-tools"><div className="festapp-directory-actions"><button type="button" className="festapp-directory-search-action" onClick={toggleContactSearch} aria-expanded={contactSearchOpen}>🔍 {contactSearchOpen?"Fermer":"Rechercher"}</button><button type="button" className="festapp-directory-add-action" disabled={demoReadOnly} onClick={openContactForm}>＋ Ajouter</button></div>{contactSearchOpen&&<label className="festapp-directory-search">Rechercher un contact<input ref={contactSearchRef} type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Nom, téléphone, e-mail…"/></label>}<div className="festapp-directory-filters"><label>Catégorie<select value={contactType} onChange={e=>setContactType(e.target.value)}><option value="tous">Tous les contacts</option><option value="bénévole">Bénévoles</option><option value="exposant">Exposants</option><option value="groupe">Groupes</option><option value="fournisseur">Fournisseurs</option><option value="intervenant">Intervenants</option></select></label><span role="status">{records.length} contact{records.length>1?"s":""}</span></div></div>}
 {tab==="equipment"&&<div className="festapp-directory-tools"><div className="festapp-directory-actions"><button type="button" className="festapp-directory-search-action" aria-expanded={equipmentSearchOpen} onClick={toggleEquipmentSearch}>🔍 {equipmentSearchOpen?"Fermer":"Rechercher"}</button><button type="button" className="festapp-directory-add-action" disabled={demoReadOnly} onClick={openEquipmentForm}>＋ Ajouter</button></div>{equipmentSearchOpen&&<label className="festapp-directory-search">Rechercher du matériel<input ref={equipmentSearchRef} type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Nom, emplacement…"/></label>}<p className="festapp-equipment-count" role="status">{records.length} matériel{records.length>1?"s":""}</p></div>}
 {tab!=="equipment"&&tab!=="contacts"&&<div className="festapp-directory-tools"><div className="festapp-directory-actions"><button type="button" className="festapp-directory-search-action" aria-expanded={moduleSearchOpen} onClick={toggleModuleSearch}>🔍 {moduleSearchOpen?"Fermer":"Rechercher"}</button><button type="button" className="festapp-directory-add-action" disabled={demoReadOnly} onClick={openModuleForm}>＋ Ajouter</button></div>{moduleSearchOpen&&<label className="festapp-directory-search">Rechercher<input ref={moduleSearchRef} type="search" value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Rechercher une fiche…"/></label>}<p className="festapp-equipment-count" role="status">{records.length} fiche{records.length>1?"s":""}</p></div>}
 {BULK_ENTRY_CATEGORIES.has(tab)&&(tab!=="contacts"||contactFormOpen)&&(tab!=="equipment"||equipmentFormOpen)&&(tab==="contacts"||tab==="equipment"||moduleFormOpen)&&<details className="festapp-optional-tool"><summary>Ajouter plusieurs fiches d’un coup</summary><BulkEntry key={tab+":"+recordEventId} category={tab} fields={current.fields} records={recordsForManifestation(data[tab]||[],tab,moduleScopeEventId)} eventId={recordEventId} readOnly={demoReadOnly} onAppend={values=>{const result=appendBulkEntry(data,{category:tab,values,eventId:recordEventId,newId:()=>crypto.randomUUID()});if(result.added)setData(result.data);return result.added;}}/></details>}
 {(tab==="contacts"?contactFormOpen:tab==="equipment"?equipmentFormOpen:moduleFormOpen)&&<form onSubmit={add} ref={tab==="contacts"?contactFormRef:tab==="equipment"?equipmentFormRef:moduleFormRef} className="festapp-directory-form">
  {tab!=="events"&&tab!=="contacts"&&tab!=="ecocups"&&(scopeEvent?<p className="festapp-module-attached">🔗 Cette fiche sera rangée dans <strong>{scopeEvent.values[0]}</strong></p>:<label>Manifestation associée<select value={recordEventId} onChange={e=>setRecordEventId(e.target.value)}><option value="">Non attribuée</option>{eventOptions.map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label>)}
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
     <>{tab==="shifts"&&i===2&&<div className="post-choices">{volunteerPosts.map(post=><button key={post} type="button" className={form[2]===post?"post-choice selected":"post-choice"} aria-pressed={form[2]===post} onClick={()=>setForm(f=>f.map((v,j)=>j===2?post:v))}>{post}</button>)}</div>}{(tab==="posts"&&i===1)||(tab==="recipes"&&i>0)||(tab==="archives"&&i===2)?<textarea rows={tab==="posts"?6:4} value={form[i]} onChange={e=>setForm(f=>f.map((v,j)=>i===j?e.target.value:v))} placeholder={label}/>:<input required={i===0} value={form[i]} onChange={e=>setForm(f=>f.map((v,j)=>i===j?e.target.value:v))} placeholder={label}/>}</>}
   </label>)}
   {tab==="contacts"&&<>
    <label>E-mail<input type="email" autoComplete="off" maxLength={320} value={contactEmail} onChange={e=>setContactEmail(e.target.value)} placeholder="adresse@exemple.fr"/></label>
    <label>Téléphone<input type="tel" inputMode="tel" autoComplete="off" maxLength={64} value={contactPhone} onChange={e=>setContactPhone(e.target.value)} placeholder="06 00 00 00 00"/></label>
   </>}
  </div>
  {tab==="contacts"&&<div className="festapp-contact-photo-field"><label className="festapp-contact-photo-add"><span className="festapp-contact-photo-preview">{contactPhotoPreview?<img src={contactPhotoPreview} alt="Aperçu du portrait choisi"/>:<ModuleGlyph kind="camera"/>}<span className="festapp-contact-photo-plus" aria-hidden="true">＋</span></span><span><strong>{contactPhotoFile?"Changer la photo":"＋ Ajouter une photo"}</strong><small>{contactPhotoFile?contactPhotoFile.name:"Facultatif · depuis la galerie du téléphone"}</small></span><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif" disabled={demoReadOnly||contactPhotoBusy} onChange={chooseContactPhoto}/></label>{contactPhotoFile&&<button type="button" className="secondary" disabled={contactPhotoBusy} onClick={()=>setContactPhotoFile(null)}>Retirer la photo choisie</button>}<p>La photo sera liée à cette fiche lors de l’enregistrement et restera sur cet appareil. Elle sera incluse dans le ZIP complet.</p></div>}
  {tab==="contacts"&&<p className="note">Les anciennes coordonnées du champ libre restent intactes. Recopiez-les dans E-mail ou Téléphone après vérification.</p>}
  <button type="submit" disabled={demoReadOnly||contactPhotoBusy}>{contactPhotoBusy?"Enregistrement de la photo…":editingId?"Enregistrer les modifications":"+ Ajouter"}</button>
  <button type="button" className="secondary" disabled={contactPhotoBusy} onClick={()=>cancelEdit()}>Annuler</button>
 </form>}
 {tab==="shifts"&&<details className="festapp-optional-tool"><summary>🕒 Répartition et planning des bénévoles</summary><section className="volunteer-agenda" aria-label="Planning des bénévoles par manifestation"><h3>🕒 Qui fait quoi ?</h3><div className="needs-backup-actions"><label className="needs-import">📂 Restaurer les besoins<input type="file" accept=".json,application/json" disabled={demoReadOnly} onChange={uploadVolunteerNeeds}/></label></div><button type="button" className="secondary" disabled={!printEvent||!printSchedule?.total} onClick={()=>window.print()}>🖨️ Imprimer le planning</button><label>Manifestation à afficher<select value={recordEventId} onChange={e=>setRecordEventId(e.target.value)}><option value="">Choisir une manifestation</option>{eventOptions.map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label>{recordEventId?(()=>{const schedule=volunteerSchedule(data.shifts||[],recordEventId);const summary=volunteerPostSummary(data.shifts||[],recordEventId,volunteerPosts);return <><p role="status">{schedule.total} affectation(s) pour cette manifestation</p><div className="volunteer-role-grid" aria-label="Répartition des bénévoles par poste">{summary.posts.map(item=>{const target=volunteerNeeds[recordEventId]?.[item.post];const status=staffingStatus(item.count,target);return <div className="volunteer-role-card" key={item.post}><span>{item.post}</span><strong>{item.count}{target!==undefined?` / ${target}`:""}</strong><small>{status.label}</small><label>Besoin<input aria-label={"Besoin pour "+item.post} type="number" min="0" max="1000" step="1" disabled={demoReadOnly} value={target??""} placeholder="À définir" onChange={e=>{const value=e.target.value;if(value!==""&&(!/^\d+$/.test(value)||Number(value)>1000))return;setVolunteerNeeds(old=>{const next={...old,[recordEventId]:{...(old[recordEventId]||{})}};if(value==="")delete next[recordEventId][item.post];else next[recordEventId][item.post]=Number(value);return next;});}}/></label></div>})}</div>{needsWarning&&<p role="alert">{needsWarning}</p>}{(summary.other>0||summary.unassigned>0)&&<p className="note">{summary.other>0?`${summary.other} affectation(s) sur d’autres postes. `:""}{summary.unassigned>0?`${summary.unassigned} poste(s) à préciser.`:""}</p>}<div className="agenda-list">{schedule.scheduled.map(r=><article key={r.id} className="agenda-item"><strong className="agenda-time">{r.time}</strong><div><strong>{r.name}</strong><p>{r.post||"Poste non précisé"}</p></div></article>)}</div>{schedule.unscheduled.length>0&&<div className="note"><strong>Créneaux à préciser ({schedule.unscheduled.length})</strong>{schedule.unscheduled.map(r=><p key={r.id}>{r.name} — {r.post||"Poste non précisé"} ({r.time||"horaire manquant"})</p>)}</div>}{schedule.total===0&&<p>Aucun bénévole affecté pour le moment.</p>}</>})():<p>Sélectionnez une manifestation pour consulter ses créneaux.</p>}</section>
 <p className="note">Choisissez un bénévole dans l’annuaire ou saisissez son nom manuellement. Seuls les contacts classés « bénévole » sont proposés. Planning local : indiquez les créneaux au format 10:00-12:30. Si un bénévole a deux créneaux qui se chevauchent sur la même manifestation, l’enregistrement est refusé. Les horaires sans date ne permettent pas de vérifier les conflits entre journées différentes.</p></details>}
 {tab==="tasks"&&<p role="status" className="note">✅ {recordsForManifestation(data.tasks||[],tab,moduleScopeEventId).filter(r=>r.done===true).length} tâche(s) terminée(s) sur {recordsForManifestation(data.tasks||[],tab,moduleScopeEventId).length}. Cochez une tâche pour la marquer comme faite ; responsable et échéance sont conservés.</p>}
 {tab==="equipment"&&<EquipmentGrid records={records} readOnly={demoReadOnly} onEdit={beginEdit} onDelete={remove} photoRevision={photoRefreshRevision} onPhotoChange={()=>setPhotoRefreshRevision(v=>v+1)}/>}
 {tab!=="equipment"&&<RecordCardGrid category={tab} fields={current.fields} records={records} readOnly={demoReadOnly} onEdit={beginEdit} onDelete={remove} onToggleDone={toggleTaskDone} onCalculateRecipe={openRecipeCalculator} photoRevision={photoRefreshRevision} onPhotoChange={()=>setPhotoRefreshRevision(v=>v+1)}/>}
 {PHOTO_CATEGORIES.includes(tab)&&tab!=="equipment"&&<details className="festapp-equipment-photo-manage"><summary>📸 Gérer les photos de cette rubrique</summary><PhotoVault scope={tab} records={recordsForManifestation(data[tab]||[],tab,moduleScopeEventId)} readOnly={demoReadOnly} photoRefreshRevision={photoRefreshRevision} onChange={()=>setPhotoRefreshRevision(v=>v+1)}/></details>}
 {tab==="equipment"&&<details className="festapp-equipment-photo-manage"><summary>📸 Voir toutes les photos du matériel</summary><PhotoVault scope="equipment" records={recordsForManifestation(data.equipment||[],"equipment",moduleScopeEventId)} readOnly={demoReadOnly} photoRefreshRevision={photoRefreshRevision} onChange={()=>setPhotoRefreshRevision(v=>v+1)}/></details>}
 </section>
 </details>
 <section className="print-sheet" aria-label="Planning imprimable des bénévoles"><h1>FEST’APP — Planning bénévoles</h1><h2>{printEvent?.values[0]||"Manifestation non sélectionnée"}</h2><p>{printEvent?.values[1]?"Date : "+printEvent.values[1]:"Date non renseignée"} · {printEvent?.values[2]||"Lieu non renseigné"}</p><table><thead><tr><th>Horaires</th><th>Bénévole</th><th>Poste</th></tr></thead><tbody>{(printSchedule?.scheduled||[]).map(r=><tr key={r.id}><td>{r.time}</td><td>{r.name}</td><td>{r.post||"À préciser"}</td></tr>)}</tbody></table>{printSchedule?.unscheduled.length>0&&<><h3>Horaires à préciser</h3><table><thead><tr><th>Bénévole</th><th>Poste</th><th>Créneau saisi</th></tr></thead><tbody>{printSchedule.unscheduled.map(r=><tr key={r.id}><td>{r.name}</td><td>{r.post||"À préciser"}</td><td>{r.time||"Non renseigné"}</td></tr>)}</tbody></table></>}<p className="print-footer">Document issu de la démonstration locale FEST’APP — vérifier les affectations avant affichage.</p></section>
 <BottomNavigation onHome={goToHome} onOpenModule={openModule} onSettings={()=>settingsOpen?setSettingsOpen(false):openSettings()} settingsOpen={settingsOpen} orgTodosOpen={orgTodosOpen} onToggleOrgTodos={()=>setOrgTodosOpen(open=>!open)} tasks={data.tasks||[]} onAddTodo={addQuickTodo} onToggleTodo={toggleTaskDone} readOnly={demoReadOnly}/>
 </main>
}
createRoot(document.getElementById("root")).render(<App/>);
