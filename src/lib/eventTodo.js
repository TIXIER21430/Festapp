export const TODO_STAGES=Object.freeze([
 {key:'Avant',icon:'🗓️',label:'Avant la manifestation',hint:'Préparer, réserver, commander'},
 {key:'Pendant',icon:'🎉',label:'Pendant la manifestation',hint:'Installer, accueillir, assurer le service'},
 {key:'Après',icon:'🧹',label:'Après la manifestation',hint:'Ranger, remercier, faire le bilan'}
]);

const datePattern=/^\d{4}-\d{2}-\d{2}$/;
export function isValidTodoDate(value){
 if(!datePattern.test(value))return false;
 const [year,month,day]=value.split('-').map(Number);
 if(year<2020||year>2099)return false;
 const d=new Date(Date.UTC(year,month-1,day));
 return d.getUTCFullYear()===year&&d.getUTCMonth()===month-1&&d.getUTCDate()===day;
}

export function todoStage(task,eventName=''){
 const explicit=String(task?.phase||'').trim();
 if(TODO_STAGES.some(stage=>stage.key===explicit))return explicit;
 // The 2026 Drive transcription sometimes inherited the previous heading.
 // Use the original checklist heading when a historic task title identifies it.
 const template=DRIVE_CHECKLISTS[String(eventName).replace(/\s+20\d{2}$/,'')];
 if(template&&typeof task?.values?.[0]==='string'){
  const clean=value=>value.toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[…\.]+$/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const taskName=clean(task.values[0]);
  if(taskName.length>=5){
   const match=Object.entries(template.phases).flatMap(([heading,names])=>names.filter(name=>{
    const expected=clean(name);
    return taskName===expected||taskName.startsWith(expected+' ');
   }).map(()=>heading));
   if(match.length===1)return stageFromHeading(match[0],eventName);
  }
 }
 const fallback=typeof task?.values?.[2]==='string'&&!isValidTodoDate(task.values[2])?task.values[2]:'';
 const phase=String(task?.phase||fallback).trim();
 return stageFromHeading(phase,eventName);
}

function stageFromHeading(phase,eventName){
 const text=phase.toLocaleLowerCase('fr');
 if(text==='pendant'||text==='jour j'||text.startsWith('jour j')||text.includes('samedi')||text.includes('soir'))return 'Pendant';
 if(text==='après'||text==='apres'||text.includes('suivant')||text.includes('lundi')||text.includes('démontage')||text.includes('demontage'))return 'Après';
 if(text.includes('dimanche')){
  return /saint[- ]laurent/i.test(eventName)?'Pendant':'Après';
 }
 if(text==='avant'||text.includes('veille')||text.includes('semaine')||text.includes('mercredi')||text.includes('mardi'))return 'Avant';
 return 'Avant';
}

export function collectEventTodos(tasks,eventId,eventName=''){
 if(!Array.isArray(tasks)||typeof eventId!=='string'||!eventId)throw new TypeError('Manifestation invalide.');
 const scoped=tasks.filter(task=>task?.eventId===eventId);
 return TODO_STAGES.map(stage=>{
  const rows=scoped.filter(task=>todoStage(task,eventName)===stage.key);
  const done=rows.filter(task=>task.done===true).length;
  return {...stage,rows,total:rows.length,done,remaining:rows.length-done};
 });
}

export function collectCommitteeTodos(tasks){
 if(!Array.isArray(tasks))throw new TypeError('Liste de tâches invalide.');
 const rows=tasks.filter(task=>task&&!task.eventId);
 return {rows,total:rows.length,done:rows.filter(task=>task.done===true).length,remaining:rows.filter(task=>task.done!==true).length};
}

export function createTodo({title,dueDate='',stage='Avant',eventId='',id}={}){
 if(typeof title!=='string'||!title.trim()||title.trim().length>1000)throw new TypeError('Indique une tâche de 1 à 1000 caractères.');
 if(dueDate&&!isValidTodoDate(dueDate))throw new TypeError('Date invalide.');
 if(typeof eventId!=='string'||eventId.length>200||eventId&& !TODO_STAGES.some(s=>s.key===stage))throw new TypeError('Étape ou manifestation invalide.');
 if(typeof id!=='string'||!id||id.length>200)throw new TypeError('Identifiant invalide.');
 return {id,values:[title.trim(),'',dueDate],done:false,...(eventId?{eventId,phase:stage}:{})};
}

export function displayTodoDate(value){
 if(!isValidTodoDate(value))return String(value||'').trim();
 const [year,month,day]=value.split('-');
 return `${day}/${month}/${year}`;
}
import {DRIVE_CHECKLISTS} from './eventChecklist.js';


// The permanent navigation is an index of independent lists, not a second task store.
export function collectTodoScopes(tasks=[],events=[]){
 const general=collectCommitteeTodos(tasks);
 const result=[{id:'',name:'Organisation générale',total:general.total,done:general.done,remaining:general.remaining}];
 const seen=new Set();
 for(const event of events){
  if(!event?.id||!event.values?.[0]||seen.has(event.id))continue;
  seen.add(event.id);
  const rows=tasks.filter(task=>task?.eventId===event.id);
  const done=rows.filter(task=>task.done===true).length;
  result.push({id:event.id,name:event.values[0],total:rows.length,done,remaining:rows.length-done});
 }
 return result;
}
