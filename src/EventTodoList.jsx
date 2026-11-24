import React,{useState} from 'react';
import {collectCommitteeTodos,collectEventTodos,displayTodoDate,isValidTodoDate} from './lib/eventTodo.js';

function TaskRows({rows,onToggle,readOnly}){
 return <div className="festapp-todo-rows">{rows.map(task=><label className={'festapp-todo-row'+(task.done===true?' complete':'')} key={task.id}>
  <input type="checkbox" disabled={readOnly} checked={task.done===true} onChange={()=>onToggle(task.id)} aria-label={'Terminée : '+task.values[0]}/>
  <span className="festapp-todo-content"><strong>{task.values[0]}</strong>{task.phase&&!['Avant','Pendant','Après'].includes(task.phase)&&<small>🗂️ {task.phase}</small>}{task.values[2]&&<small>{isValidTodoDate(task.values[2])?'📅 À faire pour le ':'🗂️ Repère : '}{displayTodoDate(task.values[2])}</small>}{task.values[1]&&<small>👤 {task.values[1]}</small>}</span>
 </label>)}{!rows.length&&<p className="festapp-todo-empty">Rien à faire ici pour le moment. Appuie sur + pour ajouter une tâche.</p>}</div>;
}

export default function EventTodoList({tasks=[],eventId='',eventName='',onAdd,onToggle,readOnly=false}){
 const [addingFor,setAddingFor]=useState('');
 const [title,setTitle]=useState('');
 const [date,setDate]=useState('');
 const [message,setMessage]=useState('');
 const general=!eventId;
 const groups=general?[{key:'Général',icon:'📋',label:'Organisation du comité',hint:'Réunions, démarches et tâches transversales',...collectCommitteeTodos(tasks)}]:collectEventTodos(tasks,eventId,eventName);
 function showForm(key){setAddingFor(current=>current===key?'':key);setTitle('');setDate('');setMessage('');}
 function submit(e,stage){
  e.preventDefault();
  try{
   const result=onAdd({title,dueDate:date,stage,eventId});
   if(result===false)throw new Error('Impossible d’ajouter la tâche.');
   setAddingFor('');setTitle('');setDate('');setMessage('✅ Tâche ajoutée, non cochée.');
  }catch(error){setMessage('⚠ '+(error.message||'Vérifie la saisie.'));}
 }
 return <section className="festapp-todos" aria-label={general?'Liste des tâches générales du comité':'Liste des tâches de la manifestation'}>
  <div className="festapp-todos-heading"><h3>{general?'✅ À faire pour le comité':'✅ À faire pour '+eventName}</h3><span>{groups.reduce((n,g)=>n+g.remaining,0)} à faire · {groups.reduce((n,g)=>n+g.done,0)} terminée(s)</span></div>
  {groups.map((group,i)=><details className="festapp-todo-stage" key={group.key} defaultOpen={general||i===0}>
   <summary><span className="festapp-todo-stage-icon" aria-hidden="true">{group.icon}</span><span className="festapp-todo-stage-name"><strong>{group.label}</strong><small>{group.hint}</small></span><span className="festapp-todo-stage-count">{group.done}/{group.total} ✓</span></summary>
   <TaskRows rows={group.rows} onToggle={onToggle} readOnly={readOnly}/>
   {addingFor===group.key?<form className="festapp-todo-add-form" onSubmit={e=>submit(e,group.key)}>
    <label>À faire<input autoFocus required maxLength={1000} placeholder="Ex. : Réserver les tables" value={title} onChange={e=>setTitle(e.target.value)} disabled={readOnly}/></label>
    <label>Pour quand ?<input type="date" min="2020-01-01" max="2099-12-31" value={date} onChange={e=>setDate(e.target.value)} disabled={readOnly}/></label>
    <div><button type="submit" disabled={readOnly||!title.trim()}>✅ Ajouter</button><button className="festapp-todo-cancel" type="button" onClick={()=>showForm(group.key)}>Annuler</button></div>
   </form>:<button type="button" className="festapp-todo-plus" onClick={()=>showForm(group.key)} disabled={readOnly}>➕ Ajouter une tâche {general?'':`« ${group.key} »`}</button>}
  </details>)}
  {message&&<p role="status" className="festapp-todo-status">{message}</p>}
  <p className="festapp-todo-caption">Les cases et les dates sont enregistrées dans la même liste, quel que soit le chemin d’accès. Vérifie l’état de synchronisation de l’application.</p>
 </section>;
}
