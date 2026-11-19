import React,{useEffect,useRef,useState} from 'react';
import EventTodoList from './EventTodoList.jsx';
import {collectEventTodos} from './lib/eventTodo.js';

const ICONS={'Concours de belote':'🃏','Carnaval':'🎭','Chasse aux œufs':'🐣','Fête des voisins':'🏡','Fanfare':'🎺','Vide-grenier':'🛍️','Saint-Laurent':'🎪','Halloween':'🎃','Marché de Noël':'🎄'};
const baseName=name=>String(name||'').replace(/\s+20\d{2}$/,'');
export function homeManifestations(events){
 const list=[];const used=new Set();
 for(const record of events||[]){
  if(!record?.id||!record?.values?.[0])continue;
  const base=baseName(record.values[0]);
  if(!used.has(base)){used.add(base);list.push(record);continue;}
  const i=list.findIndex(row=>baseName(row.values[0])===base);
  const current=list[i];
  if(i>=0&&(!current.values[1]&&record.values[1]||/20\d{2}$/.test(record.values[0])&&!/20\d{2}$/.test(current.values[0])))list[i]=record;
 }
 return list;
}

// Les six actions du quotidien restent visibles ; le reste est disponible sur demande.
const features=[
 ['tasks','✅','À faire'],
 ['shifts','👥','Bénévoles'],
 ['shopping','🛒','Achats'],
 ['till','🧾','Caisse / SumUp'],
 ['recipes','🍲','Recettes'],
 ['posts','📣','Communication']
];
const secondaryFeatures=[
 ['equipment','🧰','Matériel'],
 ['finance','📊','Bilan financier'],
 ['feedback','📝','Retours'],
 ['archives','📸','Photos et archives']
];

export default function ManifestationHub({events=[],tasks=[],selectedId='',onSelect,onBack,onOpenModule,onOpenTill,tillOpen=false,onToggleTodo,onAddTodo,onChecklist,readOnly=false}){
 const [showTasks,setShowTasks]=useState(false);
 const [checklistMessage,setChecklistMessage]=useState('');
 const rootRef=useRef(null);
 const chosen=events.find(row=>row.id===selectedId);
 const cards=homeManifestations(events);
 useEffect(()=>{setShowTasks(false);setChecklistMessage('');},[selectedId]);
 const scrollHere=()=>rootRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
 function goTo(record){onSelect(record.id);scrollHere();}
 function doFeature(key){
  if(key==='tasks'){setShowTasks(visible=>!visible);return;}
  if(key==='till'){onOpenTill(chosen);return;}
  onOpenModule(key,chosen.id);
 }
 const grouped=chosen?collectEventTodos(tasks,chosen.id,chosen.values[0]):[];
 const done=grouped.reduce((n,g)=>n+g.done,0),total=grouped.reduce((n,g)=>n+g.total,0);
 return <section ref={rootRef} className="festapp-hub" aria-label="Accueil des manifestations">
  {!chosen?<>
   <div className="festapp-hub-header"><h2>Quelle fête ouvre-t-on ?</h2></div>
   <div className="festapp-manif-grid">{cards.map((event,i)=>{
    const base=baseName(event.values[0]);const groups=collectEventTodos(tasks,event.id,event.values[0]);const remaining=groups.reduce((n,g)=>n+g.remaining,0);
    return <button type="button" className="festapp-manif-card" key={event.id} onClick={()=>goTo(event)}>
     <span className="festapp-manif-icon" aria-hidden="true">{ICONS[base]||'🎉'}</span><strong>{event.values[0]}</strong><small>{event.values[1]||'Date à préciser'}</small><em>{remaining} tâche(s) à faire</em>
    </button>;
   })}</div>
  </>:<>
   <button type="button" className="festapp-hub-back" onClick={()=>{onBack();scrollHere();}}>← Toutes les manifestations</button>
   <div className="festapp-event-heading"><span aria-hidden="true">{ICONS[baseName(chosen.values[0])]||'🎉'}</span><div><small>Ma manifestation</small><h2>{chosen.values[0]}</h2><p>📅 {chosen.values[1]||'Date à confirmer'}{chosen.values[2]?' · 📍 '+chosen.values[2]:''}</p></div></div>
   {!tillOpen&&<>
    {total>0&&<div className="festapp-event-progress"><div><strong>{done} / {total}</strong><span>tâches terminées</span></div><progress max={Math.max(1,total)} value={done} aria-label="Tâches terminées pour cette manifestation"/></div>}
    <div className="festapp-feature-grid">{features.map(([key,icon,title])=><button type="button" className={'festapp-feature-tile'+(key==='tasks'&&showTasks?' selected':'')} key={key} onClick={()=>doFeature(key)} aria-expanded={key==='tasks'?showTasks:undefined}><span aria-hidden="true">{icon}</span><strong>{title}</strong>{key==='tasks'&&<small>Pour cette fête</small>}{key==='shifts'&&<small>Planning et postes</small>}</button>)}</div>
    <details className="festapp-event-more" key={chosen.id}><summary>Autres outils de cette fête <span>＋</span></summary><div className="festapp-feature-grid secondary">{secondaryFeatures.map(([key,icon,title])=><button type="button" className="festapp-feature-tile" key={key} onClick={()=>doFeature(key)}><span aria-hidden="true">{icon}</span><strong>{title}</strong></button>)}</div></details>
    {showTasks&&<div className="festapp-event-todo-panel"><EventTodoList key={chosen.id} tasks={tasks} eventId={chosen.id} eventName={chosen.values[0]} onToggle={onToggleTodo} onAdd={onAddTodo} readOnly={readOnly}/><button type="button" className="festapp-checklist-add" disabled={readOnly} onClick={()=>setChecklistMessage(onChecklist(chosen))}>📋 Ajouter les tâches du modèle Drive (sans doublons)</button>{checklistMessage&&<p role="status" className="festapp-todo-status">{checklistMessage}</p>}</div>}
   </>}
  </>}
 </section>;
}
