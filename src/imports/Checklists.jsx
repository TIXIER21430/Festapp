import React,{useState} from "react";
import {taskTemplates} from "./taskTemplates.js";
const KEY="festapp-checklists-v1";
function read(){try{return JSON.parse(localStorage.getItem(KEY)||"null")||taskTemplates.map(t=>({...t}))}catch{return null}}
export default function Checklists(){
 const [tasks,setTasks]=useState(read),[event,setEvent]=useState("Saint-Laurent"),[newTask,setNewTask]=useState("");
 const all=tasks||taskTemplates;
 const events=[...new Set([...taskTemplates.map(t=>t.event),...all.map(t=>t.event)])];
 const visible=all.filter(t=>t.event===event),done=visible.filter(t=>t.done).length;
 function save(next){localStorage.setItem(KEY,JSON.stringify(next));setTasks(next)}
 function initialize(){if(tasks?.length&&!confirm("Réimporter les modèles ? Les coches actuelles seront perdues."))return;save(taskTemplates.map(t=>({...t})))}
 function toggle(id){save(all.map(t=>t.id===id?{...t,done:!t.done}:t))}
 function add(e){e.preventDefault();if(!newTask.trim())return;save([...all,{id:crypto.randomUUID(),event,phase:"À organiser",title:newTask.trim(),done:false}]);setNewTask("")}
 const phases=[...new Set(visible.map(t=>t.phase))];
 return <div className="recipe-module">
 <p className="note">Modèles extraits des documents Saint-Laurent et du compte rendu du 11/11/2026 pour Noël. Les coches sont indépendantes des documents Drive et enregistrées uniquement sur cet appareil. Réinitialiser pour chaque nouvelle édition.</p>
 <button onClick={initialize}>{"Réinitialiser les listes depuis les modèles Drive"}</button>
 <label>Manifestation<select value={event} onChange={e=>setEvent(e.target.value)}>{events.map(x=><option key={x}>{x}</option>)}</select></label>
 <p><strong>{done} / {visible.length} tâches terminées</strong></p>
 {phases.map(phase=><section key={phase}><h3>{phase}</h3><div className="checklist">{visible.filter(t=>t.phase===phase).map(t=><label key={t.id} className="checklist-item"><input type="checkbox" checked={t.done} onChange={()=>toggle(t.id)}/><span className={t.done?"completed":""}>{t.title}</span></label>)}</div></section>)}
 <form onSubmit={add} className="recipe-form"><label>Nouvelle tâche<input required value={newTask} onChange={e=>setNewTask(e.target.value)}/></label><button>+ Ajouter une tâche</button></form>
 </div>
}