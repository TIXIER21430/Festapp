import React,{useEffect,useRef,useState} from "react";
import {createRoot} from "react-dom/client";
import "./style.css";

const categories=[
{key:"events",title:"Manifestations",icon:"🎉",fields:["Nom","Date","Lieu"]},
{key:"tasks",title:"Tâches",icon:"✅",fields:["Tâche","Responsable","Échéance","Statut"]},
{key:"shopping",title:"Achats",icon:"🛒",fields:["Article","Quantité","État"]},
{key:"stock",title:"Stock",icon:"📦",fields:["Article","Quantité","Seuil d'alerte"]},
{key:"ecocups",title:"Écocups",icon:"🥤",fields:["Mouvement","Quantité","Manifestation"]},
{key:"contacts",title:"Annuaire",icon:"👥",fields:["Nom","Catégorie","Contact","Email","Téléphone"]},
{key:"shifts",title:"Planning bénévoles",icon:"🕒",fields:["Bénévole","Créneau","Poste","Manifestation"]},
{key:"feedback",title:"Retours terrain",icon:"📝",fields:["Manifestation","Type","Remarque"]},
{key:"recipes",title:"Recettes",icon:"🍲",fields:["Nom","Ingrédients","Préparation"]},
{key:"finance",title:"Finances",icon:"📊",fields:["Manifestation","Montant (€)","Nature"]}
];
const eventNames=["Concours de belote","Carnaval","Chasse aux œufs","Fête des voisins","Fanfare","Vide-grenier","Saint-Laurent","Halloween","Marché de Noël"];
const seed={events:eventNames.map((name,i)=>({id:"seed-"+i,values:[name,"",""]}))};
const storageKey="festapp-demo-v1";
const euros=new Intl.NumberFormat("fr-FR",{style:"currency",currency:"EUR"});
function parseAmount(value){const v=String(value||"").trim().replace(",",".");if(!/^\d+(?:\.\d{1,2})?$/.test(v))return null;const n=Number(v);return Number.isSafeInteger(Math.round(n*100))?n:null}
function financeNature(value){const v=String(value||"").trim().toLowerCase();return v==="recette"?"Recette":v==="dépense"||v==="depense"?"Dépense":null}
function eventDate(value){
 const text=String(value||"").trim();
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
 if(!match)return null;
 const d=new Date(Number(match[1]),Number(match[2])-1,Number(match[3]));
 return d.getFullYear()===Number(match[1])&&d.getMonth()===Number(match[2])-1&&d.getDate()===Number(match[3])?d:null;
}
function load(){try{return {...seed,...JSON.parse(localStorage.getItem(storageKey)||"{}")}}catch{return seed}}
function App(){
 const [data,setData]=useState(load);
 const [tab,setTab]=useState("events");
 const [showDashboard,setShowDashboard]=useState(true);
 const [form,setForm]=useState(["","",""]);
 const [filter,setFilter]=useState("");
 const [contactCategory,setContactCategory]=useState("Tous");
 const [shiftEvent,setShiftEvent]=useState("Toutes");
 const backupFileRef=useRef(null);
 const [ecocupThreshold,setEcocupThreshold]=useState(()=>{const n=Number(localStorage.getItem("festapp-ecocups-seuil"));return Number.isFinite(n)&&n>=0?n:100});
 useEffect(()=>{localStorage.setItem(storageKey,JSON.stringify(data))},[data]);
 useEffect(()=>{localStorage.setItem("festapp-ecocups-seuil",String(ecocupThreshold))},[ecocupThreshold]);
 const ecocupMovements=(data.ecocups||[]).filter(r=>r.values[0]==="Entrée"||r.values[0]==="Sortie");
 const ecocupBalance=ecocupMovements.reduce((sum,r)=>sum+(r.values[0]==="Entrée"?1:-1)*Number(r.values[1]||0),0);
 const invalidEcocupHistory=(data.ecocups||[]).length!==ecocupMovements.length;
 const validEcocupMovements=ecocupMovements.every(r=>Number.isSafeInteger(Number(r.values[1]))&&Number(r.values[1])>0);
 const current=categories.find(c=>c.key===tab);
 const records=(data[tab]||[]).filter(r=>r.values.join(" ").toLocaleLowerCase().includes(filter.toLocaleLowerCase())&&(tab!=="contacts"||contactCategory==="Tous"||r.values[1]===contactCategory)&&(tab!=="shifts"||shiftEvent==="Toutes"||r.values[3]===shiftEvent));
 const contactTypes=["Bénévole","Exposant","Groupe / artiste","Partenaire","Autre"];
 const contactEmails=(data.contacts||[]).filter(r=>contactCategory==="Tous"||r.values[1]===contactCategory).map(r=>String(r.values[3]||"").trim()).filter(email=>/^[^\s@;]+@[^\s@;]+\.[^\s@;]+$/.test(email));
 const uniqueContactEmails=[...new Set(contactEmails.map(x=>x.toLowerCase()))];
 const financeRows=(data.finance||[]).map(r=>({name:String(r.values?.[0]||"").trim(),amount:parseAmount(r.values?.[1]),nature:financeNature(r.values?.[2])}));
 const invalidFinanceRows=financeRows.filter(r=>!r.name||r.amount===null||!r.nature).length;
 const validFinanceRows=financeRows.filter(r=>r.name&&r.amount!==null&&r.nature);
 const financeTotals=validFinanceRows.reduce((totals,r)=>{totals[r.nature==="Recette"?"income":"expense"]+=r.amount;return totals},{income:0,expense:0});
 const shiftEvents=[...new Set([...(data.events||[]).map(r=>String(r.values?.[0]||"").trim()),...(data.shifts||[]).map(r=>String(r.values?.[3]||"").trim())].filter(Boolean))].sort((a,b)=>a.localeCompare(b,"fr"));
 const shiftConflicts=(data.shifts||[]).filter((r,i,rows)=>r.values[0]?.trim()&&r.values[1]?.trim()&&rows.some((other,j)=>i!==j&&other.values[0]?.trim().toLocaleLowerCase("fr")===r.values[0]?.trim().toLocaleLowerCase("fr")&&other.values[1]?.trim().toLocaleLowerCase("fr")===r.values[1]?.trim().toLocaleLowerCase("fr")&&other.values[3]?.trim().toLocaleLowerCase("fr")===r.values[3]?.trim().toLocaleLowerCase("fr")));
 const today=new Date();today.setHours(0,0,0,0);
 const datedEvents=(data.events||[]).map(r=>({id:r.id,name:String(r.values?.[0]||""),date:eventDate(r.values?.[1]),place:String(r.values?.[2]||"")})).filter(r=>r.date);
 const upcomingEvents=datedEvents.filter(r=>r.date>=today).sort((a,b)=>a.date-b.date).slice(0,5);
 const undatedEvents=(data.events||[]).filter(r=>!eventDate(r.values?.[1])).length;
 const overdueTasks=(data.tasks||[]).filter(r=>{const d=eventDate(r.values?.[2]);return d&&d<today&&r.values?.[3]!=="Terminée"}).length;
 const pendingTasks=(data.tasks||[]).filter(r=>r.values?.[3]!=="Terminée").length;
 const eventCount=(data.events||[]).length;
 function goToModule(key){const category=categories.find(c=>c.key===key);setTab(key);setForm(Array(category.fields.length).fill(""));setFilter("");setContactCategory("Tous");setShiftEvent("Toutes")}
 const financeByEvent=Object.values(validFinanceRows.reduce((acc,r)=>{const key=r.name.toLocaleLowerCase("fr");if(!acc[key])acc[key]={name:r.name,income:0,expense:0};acc[key][r.nature==="Recette"?"income":"expense"]+=r.amount;return acc},{})).sort((a,b)=>a.name.localeCompare(b.name,"fr"));
 function add(e){e.preventDefault();if(!form[0].trim())return;
  if(tab==="tasks"&&form[2]?.trim()&&!eventDate(form[2])){alert("L’échéance doit être une date valide.");return}
  if(tab==="tasks"&&form[3]&&!["À faire","En cours","Terminée"].includes(form[3])){alert("Statut de tâche invalide.");return}
  if(tab==="events"&&form[1]?.trim()&&!eventDate(form[1])){alert("La date doit être au format AAAA-MM-JJ et correspondre à une date valide.");return}
  if(tab==="contacts"&&!contactTypes.includes(form[1])){alert("Choisissez une catégorie pour ce contact.");return}
  if(tab==="contacts"&&form[3]?.trim()&&!/^[^\s@;]+@[^\s@;]+\.[^\s@;]+$/.test(form[3].trim())){alert("Adresse email invalide.");return}
  if(tab==="shifts"){
   const who=form[0]?.trim(),slot=form[1]?.trim(),event=form[3]?.trim();
   if(!who||!slot||!event){alert("Indiquez le bénévole, le créneau et la manifestation.");return}
   if((data.shifts||[]).some(r=>r.values[0]?.trim().toLocaleLowerCase("fr")===who.toLocaleLowerCase("fr")&&r.values[1]?.trim().toLocaleLowerCase("fr")===slot.toLocaleLowerCase("fr")&&r.values[3]?.trim().toLocaleLowerCase("fr")===event.toLocaleLowerCase("fr"))){alert("Ce bénévole figure déjà sur ce créneau pour cette manifestation.");return}
  }
  if(tab==="finance"){
   if(!form[0].trim()||parseAmount(form[1])===null||!financeNature(form[2])){alert("Indiquez une manifestation, un montant positif valide (2 décimales maximum) et Recette ou Dépense.");return}
  }
  if(tab==="ecocups"){
   const quantity=Number(form[1]);
   if(!["Entrée","Sortie"].includes(form[0])||!Number.isSafeInteger(quantity)||quantity<=0){alert("Choisissez Entrée ou Sortie et une quantité entière positive.");return}
   if(form[0]==="Sortie"&&quantity>ecocupBalance){alert("Stock insuffisant : impossible de sortir plus d’écocups que le solde disponible.");return}
  }
  setData(d=>({...d,[tab]:[...(d[tab]||[]),{id:crypto.randomUUID(),values:current.fields.map((_,i)=>tab==="tasks"&&i===3?(form[i]||"À faire"):(form[i]||"").trim())}]}));setForm(Array(current.fields.length).fill(""))}

 function toggleTask(id){setData(d=>({...d,tasks:(d.tasks||[]).map(r=>r.id===id?{...r,values:[...r.values.slice(0,3),r.values?.[3]==="Terminée"?"À faire":"Terminée"]}:r)}))}
 function remove(id){if(!confirm("Supprimer cette fiche ?"))return;setData(d=>({...d,[tab]:(d[tab]||[]).filter(r=>r.id!==id)}))}
 function downloadBackup(){const payload={format:"festapp-backup",version:1,createdAt:new Date().toISOString(),ecocupThreshold,data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="festapp-sauvegarde-"+new Date().toISOString().slice(0,10)+".json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 async function restoreBackup(event){const file=event.target.files?.[0];event.target.value="";if(!file)return;try{if(file.size>5_000_000)throw new Error("Fichier trop volumineux (maximum 5 Mo).");const backup=JSON.parse(await file.text());if(backup?.format!=="festapp-backup"||backup.version!==1||!backup.data||typeof backup.data!=="object"||Array.isArray(backup.data))throw new Error("Format de sauvegarde non reconnu.");const restored={};for(const c of categories){const rows=backup.data[c.key]??[];if(!Array.isArray(rows)||rows.length>10000||!rows.every(r=>r&&typeof r.id==="string"&&Array.isArray(r.values)&&(r.values.length===c.fields.length||((c.key==="contacts"||c.key==="shifts"||c.key==="tasks")&&r.values.length===3))&&r.values.every(v=>typeof v==="string")))throw new Error("Données invalides pour "+c.title);restored[c.key]=(c.key==="contacts"||c.key==="shifts"||c.key==="tasks")?rows.map(r=>({...r,values:[...r.values,...Array(c.fields.length-r.values.length).fill(c.key==="tasks"?"À faire":"")]})):rows}const threshold=Number(backup.ecocupThreshold);if(!Number.isSafeInteger(threshold)||threshold<0)throw new Error("Seuil d’alerte invalide.");if(!confirm("Restaurer cette sauvegarde ? Les données locales actuelles seront remplacées. Sauvegardez-les d’abord si nécessaire."))return;setData(restored);setEcocupThreshold(threshold);setFilter("");setForm(["","",""]);alert("Sauvegarde restaurée sur cet appareil.")}catch(error){alert("Restauration impossible : "+error.message)}}
 function contactMailing(){if(!uniqueContactEmails.length){alert("Aucun email valide dans cette catégorie.");return}if(uniqueContactEmails.length>50){alert("Plus de 50 destinataires : filtrez par catégorie pour éviter les limites des logiciels de messagerie.");return}window.location.href="mailto:?bcc="+encodeURIComponent(uniqueContactEmails.join(","))+"&subject="+encodeURIComponent("Comité des fêtes de Liernais")}
 function exportCsv(){const rows=[current.fields,...(data[tab]||[]).map(r=>r.values)];const csv="\uFEFF"+rows.map(row=>row.map(x=>'"'+String(x||"").replaceAll('"','""')+'"').join(";")).join("\r\n");const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv;charset=utf-8"}));a.download="festapp-"+tab+".csv";a.click();URL.revokeObjectURL(a.href)}
 return <main>
 <header><div>🎆 FEST'APP <small>Comité des fêtes de Liernais</small></div><span className="demo">Mode démonstration</span></header>
 <section className="hero"><h1>Organisons nos fêtes !</h1><p>Manifestations, bénévoles, stocks et bilans au même endroit.</p><strong>⚠ Données enregistrées uniquement sur cet appareil, non partagées avec le bureau.</strong></section>
 <div className="backup-tools"><button className="secondary" onClick={downloadBackup}>💾 Sauvegarder toutes les données</button><button className="secondary" onClick={()=>backupFileRef.current?.click()}>📂 Restaurer une sauvegarde</button><input ref={backupFileRef} type="file" accept=".json,application/json" onChange={restoreBackup} style={{display:"none"}} aria-label="Choisir une sauvegarde FESTAPP"/><small>Transfert manuel uniquement : aucune synchronisation entre appareils.</small></div>
 <section className="dashboard-section" aria-label="Tableau de bord"><div className="heading"><h2>Vue d'ensemble</h2><button className="secondary" onClick={()=>setShowDashboard(v=>!v)} aria-expanded={showDashboard}>{showDashboard?"Masquer":"Afficher"}</button></div>{showDashboard&&<><div className="dashboard-kpis"><button onClick={()=>goToModule("events")}><strong>{eventCount}</strong><span>Manifestations</span></button><button onClick={()=>goToModule("shifts")}><strong>{(data.shifts||[]).length}</strong><span>Affectations bénévoles</span></button><button onClick={()=>goToModule("tasks")}><strong>{overdueTasks}</strong><span>Tâches en retard (non terminées)</span></button><button onClick={()=>goToModule("ecocups")}><strong>{ecocupBalance}</strong><span>Écocups en stock</span></button></div><h3>Prochaines manifestations</h3>{upcomingEvents.length?<div className="upcoming-events">{upcomingEvents.map(r=><article key={r.id}><div><strong>{r.name}</strong><p>{r.date.toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}{r.place?" · "+r.place:""}</p></div><button className="secondary" onClick={()=>goToModule("events")}>Voir</button></article>)}</div>:<p>Aucune manifestation future avec une date renseignée.</p>}<p className="note">📋 {pendingTasks} tâche(s) non terminée(s) enregistrée(s).</p>{undatedEvents>0&&<p className="note">ℹ {undatedEvents} manifestation(s) sans date valide : complétez leur date dans l'onglet Manifestations pour les afficher ici.</p>}<p className="note">Tableau de bord local, calculé depuis les données de cet appareil.</p></>}</section>
 <nav aria-label="Modules">{categories.map(c=><button key={c.key} className={tab===c.key?"active":""} onClick={()=>goToModule(c.key)}>{c.icon} {c.title}</button>)}</nav>
 <section className="panel"><div className="heading"><h2>{current.icon} {current.title}</h2><button className="secondary" onClick={exportCsv}>Exporter CSV</button></div>
 {tab==="ecocups"&&<div className="ecocup-summary"><p><strong>Stock calculé : {ecocupBalance} écocups</strong> — {ecocupBalance<=ecocupThreshold?"⚠ Stock au seuil ou en dessous":"✓ Stock au-dessus du seuil"}</p><label>Seuil d’alerte<input type="number" min="0" step="1" value={ecocupThreshold} onChange={e=>{const n=Number(e.target.value);if(Number.isSafeInteger(n)&&n>=0)setEcocupThreshold(n)}}/></label><p className="note">Enregistrez d’abord une entrée pour le stock initial, puis les entrées et sorties. Le solde est recalculé automatiquement. Données conservées sur cet appareil uniquement.</p>{!validEcocupMovements&&<p className="note">⚠ Certaines quantités sont invalides : le solde peut être incorrect. Vérifiez les mouvements.</p>}{invalidEcocupHistory&&<p className="note">⚠ Des anciennes fiches au format libre ne sont pas comptabilisées. Vérifiez-les et ressaisissez leurs mouvements.</p>}</div>}
 {tab==="shifts"&&<section className="shift-summary"><label>Filtrer par manifestation<select value={shiftEvent} onChange={e=>setShiftEvent(e.target.value)}><option value="Toutes">Toutes les manifestations</option>{shiftEvents.map(ev=><option value={ev} key={ev}>{ev}</option>)}</select></label><p><strong>{(data.shifts||[]).filter(r=>shiftEvent==="Toutes"||r.values[3]===shiftEvent).length} affectation(s)</strong> affichée(s)</p>{shiftConflicts.length>0&&<p className="note">⚠ {shiftConflicts.length} affectation(s) avec le même bénévole, créneau et manifestation. Vérifiez les anciens doublons.</p>}<p className="note">Saisissez des créneaux précis (date et heures). Le contrôle détecte uniquement les créneaux identiques, pas les horaires qui se chevauchent.</p></section>}
 {tab==="finance"&&<section className="finance-summary" aria-label="Bilan financier"><div className="finance-kpis"><div><span>Recettes</span><strong>{euros.format(financeTotals.income)}</strong></div><div><span>Dépenses</span><strong>{euros.format(financeTotals.expense)}</strong></div><div><span>Solde</span><strong>{euros.format(financeTotals.income-financeTotals.expense)}</strong></div></div><h3>Résultat par manifestation</h3>{financeByEvent.length?<div className="finance-events">{financeByEvent.map(r=><article key={r.name}><strong>{r.name}</strong><span>Recettes : {euros.format(r.income)} · Dépenses : {euros.format(r.expense)}</span><b>Solde : {euros.format(r.income-r.expense)}</b></article>)}</div>:<p>Aucune opération enregistrée.</p>}{invalidFinanceRows>0&&<p className="note">⚠ {invalidFinanceRows} ancienne(s) opération(s) ignorée(s) : vérifier le montant et la nature Recette/Dépense.</p>}<p className="note">Bilan indicatif calculé à partir des saisies locales, sans rapprochement bancaire ni comptabilité officielle.</p></section>}
 {tab==="contacts"&&<div className="contact-tools"><label>Afficher les contacts <select value={contactCategory} onChange={e=>setContactCategory(e.target.value)}><option value="Tous">Toutes les catégories</option>{contactTypes.map(type=><option key={type} value={type}>{type}</option>)}</select></label><button className="secondary" type="button" onClick={contactMailing}>✉️ Préparer un email en CCI ({uniqueContactEmails.length})</button><p className="note">Ouvre votre logiciel de messagerie, sans envoyer automatiquement. Vérifiez les destinataires, leur consentement et votre message avant envoi. Les adresses ne sont pas affichées aux autres destinataires.</p></div>}
 <form onSubmit={add}><div className="fields">{current.fields.map((label,i)=><label key={label}>{label}{tab==="tasks"&&i===3?<select value={form[i]||"À faire"} onChange={e=>setForm(f=>{const a=[...f];a[i]=e.target.value;return a})}><option value="À faire">À faire</option><option value="En cours">En cours</option><option value="Terminée">Terminée</option></select>:tab==="shifts"&&i===3?<><input required list="festapp-shift-events" value={form[i]||""} onChange={e=>setForm(f=>{const a=[...f];a[i]=e.target.value;return a})} placeholder="Manifestation"/><datalist id="festapp-shift-events">{shiftEvents.map(ev=><option value={ev} key={ev}/>)}</datalist></>:tab==="finance"&&i===2?<select required value={form[i]||""} onChange={e=>setForm(f=>{const a=[...f];a[i]=e.target.value;return a})}><option value="">Choisir la nature</option><option value="Recette">Recette (+)</option><option value="Dépense">Dépense (−)</option></select>:tab==="contacts"&&i===1?<select required value={form[i]||""} onChange={e=>setForm(f=>{const a=[...f];a[i]=e.target.value;return a})}><option value="">Choisir une catégorie</option>{contactTypes.map(type=><option key={type} value={type}>{type}</option>)}</select>:tab==="ecocups"&&i===0?<select required value={form[i]||""} onChange={e=>setForm(f=>f.map((v,j)=>i===j?e.target.value:v))}><option value="">Choisir un mouvement</option><option value="Entrée">Entrée (+)</option><option value="Sortie">Sortie (−)</option></select>:<input required={i===0||(tab==="ecocups"&&i===1)||(tab==="finance"&&i===1)} type={tab==="events"&&i===1?"date":tab==="tasks"&&i===2?"date":tab==="ecocups"&&i===1?"number":tab==="contacts"&&i===3?"email":tab==="contacts"&&i===4?"tel":"text"} min={tab==="ecocups"&&i===1?"1":undefined} step={tab==="ecocups"&&i===1?"1":undefined} value={form[i]||""} onChange={e=>setForm(f=>{const a=[...f];a[i]=e.target.value;return a})} placeholder={label}/>}</label>)}</div><button type="submit">+ Ajouter</button></form>
 <label className="search">Rechercher<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Filtrer les fiches…"/></label>
 <div className="records">{records.length?records.map(r=><article key={r.id}><div><strong>{r.values[0]}</strong><p>{r.values.slice(1).filter(Boolean).join(" · ")||"Aucune précision"}</p></div><div className="record-actions">{tab==="tasks"&&<button className="secondary" onClick={()=>toggleTask(r.id)}>{r.values?.[3]==="Terminée"?"Réouvrir":"✓ Terminer"}</button>}<button className="delete" onClick={()=>remove(r.id)} aria-label={"Supprimer "+r.values[0]}>Supprimer</button></div></article>):<p>Aucune fiche pour le moment.</p>}</div>
 </section><footer>Prototype local • aucune donnée synchronisée • TIXAPP reste indépendant</footer>
 </main>
}
createRoot(document.getElementById("root")).render(<App/>);
