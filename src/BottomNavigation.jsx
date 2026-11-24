import React,{useEffect,useRef,useState} from 'react';
import EventTodoList from './EventTodoList.jsx';
import ModuleGlyph from './ModuleGlyph.jsx';
import {collectTodoScopes} from './lib/eventTodo.js';

export default function BottomNavigation({onHome,onMeetings,meetingsOpen=false,onOpenModule,onSettings,settingsOpen=false,orgTodosOpen,onToggleOrgTodos,tasks,events=[],onAddTodo,onToggleTodo,readOnly=false}){
 const closeRef=useRef(null);
 const [scope,setScope]=useState(null);
 const scopes=collectTodoScopes(tasks,events);
 const selected=scopes.find(item=>item.id===scope);
 useEffect(()=>{if(!orgTodosOpen)setScope(null);},[orgTodosOpen]);
 useEffect(()=>{if(orgTodosOpen)closeRef.current?.focus();},[orgTodosOpen]);
 return <>
  {orgTodosOpen&&<div className="festapp-org-overlay" onClick={onToggleOrgTodos}>
   <div className="festapp-org-drawer" role="dialog" aria-modal="true" aria-label="À faire — comité et manifestations" onKeyDown={e=>{if(e.key==='Escape')onToggleOrgTodos();}} onClick={e=>e.stopPropagation()}>
    <div className="festapp-org-drawer-head"><strong>📋 À faire</strong><button ref={closeRef} type="button" onClick={onToggleOrgTodos} aria-label="Fermer les tâches">✕ Fermer</button></div>
    {selected?<><button type="button" className="festapp-todo-scope-back" onClick={()=>setScope(null)}>← Toutes les listes</button><EventTodoList key={selected.id||'general'} tasks={tasks} eventId={selected.id} eventName={selected.name} onAdd={onAddTodo} onToggle={onToggleTodo} readOnly={readOnly}/></>:<div className="festapp-todo-scope-list"><p><strong>{scopes.reduce((n,s)=>n+s.remaining,0)} tâches à faire</strong> · Choisis une liste.</p>{scopes.map(item=><button type="button" key={item.id||'general'} onClick={()=>setScope(item.id)}><span><strong>{item.name}</strong><small>{item.done}/{item.total} terminées</small></span><em>{item.remaining} à faire</em></button>)}</div>}
   </div>
  </div>}
  <nav className="festapp-bottom-nav" aria-label="Navigation permanente du comité">
   {[
    ['home','🏠','Fêtes',onHome],
    ['todo','✅','À faire',onToggleOrgTodos],
    ['meetings','📝','Réunions',onMeetings],
    ['contacts','👥','Annuaire',()=>onOpenModule('contacts')],
    ['stock','📦','Stock',()=>onOpenModule('stock')],
    ['equipment','🧰','Matériel',()=>onOpenModule('equipment')],
    ['settings','⚙️','Plus',onSettings]
   ].map(([key,icon,label,action])=><button type="button" key={key} onClick={action} className={(key==='todo'&&orgTodosOpen)||(key==='meetings'&&meetingsOpen)||(key==='settings'&&settingsOpen)?'active':''} aria-label={key==='todo'?'À faire — comité et manifestations':key==='settings'?'Plus et réglages':label} aria-expanded={key==='todo'?orgTodosOpen:key==='settings'?settingsOpen:undefined}><span className="festapp-nav-icon" aria-hidden="true"><ModuleGlyph kind={key==='todo'?'tasks':key==='meetings'?'report':key}/></span><small>{label}</small></button>)}
  </nav>
 </>;
}
