import React,{useEffect,useRef} from 'react';
import EventTodoList from './EventTodoList.jsx';

export default function BottomNavigation({onHome,onOpenModule,orgTodosOpen,onToggleOrgTodos,tasks,onAddTodo,onToggleTodo,readOnly=false}){
 const closeRef=useRef(null);
 useEffect(()=>{if(orgTodosOpen)closeRef.current?.focus();},[orgTodosOpen]);
 return <>
  {orgTodosOpen&&<div className="festapp-org-overlay" onClick={onToggleOrgTodos}>
   <div className="festapp-org-drawer" role="dialog" aria-modal="true" aria-label="À faire pour l’organisation du comité" onKeyDown={e=>{if(e.key==='Escape')onToggleOrgTodos();}} onClick={e=>e.stopPropagation()}>
    <div className="festapp-org-drawer-head"><strong>📋 Organisation générale</strong><button ref={closeRef} type="button" onClick={onToggleOrgTodos} aria-label="Fermer la liste générale">✕ Fermer</button></div>
    <EventTodoList tasks={tasks} onAdd={onAddTodo} onToggle={onToggleTodo} readOnly={readOnly}/>
   </div>
  </div>}
  <nav className="festapp-bottom-nav" aria-label="Navigation permanente du comité">
   {[
    ['home','🏠','Manifestations',onHome],
    ['todo','✅','À faire',onToggleOrgTodos],
    ['contacts','👥','Bénévoles',()=>onOpenModule('contacts')],
    ['equipment','🧰','Matériel',()=>onOpenModule('equipment')],
    ['finance','📊','Finances',()=>onOpenModule('finance')]
   ].map(([key,icon,label,action])=><button type="button" key={key} onClick={action} className={key==='todo'&&orgTodosOpen?'active':''} aria-label={key==='todo'?'À faire pour l’organisation générale':label} aria-expanded={key==='todo'?orgTodosOpen:undefined}><span aria-hidden="true">{icon}</span><small>{label}</small></button>)}
  </nav>
 </>;
}
