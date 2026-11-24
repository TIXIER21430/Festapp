import {createTodo,isValidTodoDate,todoStage} from './eventTodo.js';
import {createReportNote} from './eventReport.js';
import {findVolunteerConflicts,parseShiftSlot} from './volunteerPlanning.js';
import {validateDemoData} from './demoBackup.js';

export const MEETING_SECTIONS=[
 ['before','Avant la manifestation','Réserver le groupe'],
 ['during','Pendant la manifestation','Prévoir une personne à la friteuse'],
 ['after','Après la manifestation','Ranger le matériel'],
 ['shopping','Courses de la manifestation','Gaz ; 4 bouteilles'],
 ['equipment','Matériel à acheter pour le comité','Rallonges ; 2'],
 ['general','Organisation générale','Préparer le calendrier annuel'],
 ['positive','Bilan précédent : points positifs','Bonne participation'],
 ['negative','Bilan précédent : points à améliorer','Manque de bénévoles'],
 ['used','Bilan précédent : quantités utilisées','80 kg de frites'],
 ['shifts','Affectations des bénévoles','Prénom Nom ; 10:00-12:00 ; Buvette'],
 ['free','Notes libres / autres discussions','Avant : distribuer les affiches']
];
const keys=MEETING_SECTIONS.map(x=>x[0]);
const norm=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').trim().replace(/\s+/g,' ');
export const meetingLines=text=>String(text??'').split(/\r?\n/).map(s=>s.replace(/^\s*[-•]\s+/,'').trim()).filter(Boolean);
export const isMeetingRecord=row=>typeof row?.id==='string'&&row.id.startsWith('meeting-');
export function newMeeting(id,date){
 if(!isValidTodoDate(date)||!id)throw new Error('Date ou identifiant invalide.');
 return {id:'meeting-'+id,date,eventId:'',previousId:'',nextDate:'',status:'draft',notes:Object.fromEntries(keys.map(k=>[k,'']))};
}
export function meetingRecord(m){
 if(!isMeetingRecord(m)||!isValidTodoDate(m.date)||!['draft','final'].includes(m.status)||!m.notes||keys.some(k=>typeof m.notes[k]!=='string')||['eventId','previousId','nextDate'].some(k=>typeof m[k]!=='string')||(m.nextDate&&!isValidTodoDate(m.nextDate)))throw new Error('Réunion invalide.');
 const body=JSON.stringify(m);
 if(body.length>19000)throw new Error('Notes trop longues pour une seule réunion. Crée une seconde réunion pour la suite.');
 return {id:m.id,values:['Réunion du '+m.date,m.date,body]};
}
export function readMeeting(row){
 if(!isMeetingRecord(row))return null;
 try{const m=JSON.parse(row.values[2]);if(m.id!==row.id)return null;meetingRecord(m);return m;}catch{return null;}
}
export function saveMeetingDraft(data,m){
 if(m.status!=='draft')throw new Error('Réunion déjà validée.');
 const old=(data.archives||[]).find(r=>r.id===m.id);
 if(old&&readMeeting(old)?.status!=='draft')throw new Error('Réunion déjà validée ou illisible.');
 const row=meetingRecord(m);
 return validateDemoData({...data,archives:old?data.archives.map(r=>r.id===m.id?row:r):[...(data.archives||[]),row]});
}
const aliases={avant:'before',pendant:'during','jour j':'during',apres:'after',courses:'shopping',achats:'shopping',materiel:'equipment',general:'general',comite:'general','point fort':'positive','points forts':'positive','point faible':'negative','points faibles':'negative','a ameliorer':'negative',quantites:'used',benevoles:'shifts'};
export function classifyMeetingNotes(m){
 const notes={...m.notes};const remaining=[];let count=0;
 for(const raw of String(notes.free||'').split(/\r?\n/)){
  const line=raw.trim().replace(/^[-•]\s+/,'');
  const match=line.match(/^([^:]+):\s*(.+)$/);
  const key=match&&Object.hasOwn(aliases,norm(match[1]))?aliases[norm(match[1])]:null;
  if(!key){remaining.push(raw);continue;}
  notes[key]=[notes[key],match[2]].filter(Boolean).join('\n');count++;
 }
 return {meeting:{...m,notes:{...notes,free:remaining.join('\n')}},count};
}
export function planMeeting(data,m){
 meetingRecord(m);
 const rows=[],errors=[],duplicates=[];
 const event=id=>(data.events||[]).find(r=>r.id===id);
 const future=event(m.eventId),previous=event(m.previousId);
 const add=(category,row,label)=>{
  const same=r=>{
   if((r.eventId||'')!==(row.eventId||''))return false;
   if(category==='tasks')return norm(r.values[0])===norm(row.values[0])&&(!row.eventId||todoStage(r,future?.values[0])===row.phase)&&(!row.values[2]||r.values[2]===row.values[2]);
   if(category==='shopping')return norm(r.values[0])===norm(row.values[0])&&norm(r.values[1])===norm(row.values[1]);
   return row.values.every((v,i)=>norm(v)===norm(r.values[i]));
  };
  if([...(data[category]||[]),...rows.filter(x=>x.category===category).map(x=>x.row)].some(same)){duplicates.push(label);return;}
  if(category==='shifts'&&findVolunteerConflicts([...(data.shifts||[]),...rows.filter(x=>x.category==='shifts').map(x=>x.row)],row).length){errors.push('Créneau en conflit : '+label);return;}
  rows.push({category,row,label});
 };
 for(const [key,label] of MEETING_SECTIONS){
  if(key==='free')continue;
  const lines=meetingLines(m.notes[key]);
  if(!lines.length)continue;
  const needsFuture=['before','during','after','shopping','shifts'].includes(key);
  const needsPrevious=['positive','negative','used'].includes(key);
  if(needsFuture&&!future||needsPrevious&&!previous){errors.push(label+' : sélectionne la manifestation correspondante.');continue;}
  for(const line of lines){
   const id='preview-'+rows.length;
   try{
    if(['before','during','after','general'].includes(key)){
     const phase={before:'Avant',during:'Pendant',after:'Après'}[key];
     add('tasks',createTodo({id,title:line,eventId:phase?m.eventId:'',stage:phase||'Avant'}),label+' · '+line);
    }else if(['shopping','equipment'].includes(key)){
     const [article,quantity='',...extra]=line.split(';').map(s=>s.trim());
     if(!article||extra.length||article.length>1000||quantity.length>1000)throw new Error('Utilise article ; quantité (facultative).');
     add('shopping',{id,values:[article,quantity,'À acheter'+(key==='equipment'?' · Matériel':'')],...(key==='shopping'?{eventId:m.eventId}:{})},label+' · '+line);
    }else if(needsPrevious){
     const type={positive:'Point fort',negative:'Point faible',used:'Quantité utilisée'}[key];
     if(line.length>1000)throw new Error('Ligne trop longue.');
     add('feedback',createReportNote({id,eventId:m.previousId,type,subject:line.slice(0,200),details:line.length>200?line:''}),label+' · '+line);
    }else if(key==='shifts'){
     const parts=line.split(';').map(s=>s.trim());
     if(parts.length!==3||!parts[0]||!parseShiftSlot(parts[1])||!parts[2])throw new Error('Utilise nom ; 10:00-12:00 ; poste.');
     add('shifts',{id,eventId:m.eventId,values:parts},label+' · '+line);
    }
   }catch(e){errors.push(label+' · '+line.slice(0,100)+' : '+e.message);}
  }
 }
 if(m.nextDate)add('tasks',createTodo({id:'preview-next',title:'Prochaine réunion du comité',dueDate:m.nextDate}),'Prochaine réunion · '+m.nextDate);
 return {rows,errors,duplicates};
}
export function finalizeMeeting(data,id,newId){
 const m=readMeeting((data.archives||[]).find(r=>r.id===id));
 if(!m||m.status!=='draft')throw new Error('Réunion absente ou déjà validée.');
 const plan=planMeeting(data,m);
 if(plan.errors.length)throw new Error(plan.errors.join('\n'));
 const final={...m,status:'final',eventName:(data.events||[]).find(r=>r.id===m.eventId)?.values[0]||'',previousName:(data.events||[]).find(r=>r.id===m.previousId)?.values[0]||'',added:plan.rows.length,duplicates:plan.duplicates.length};
 const next={...data,archives:data.archives.map(r=>r.id===id?meetingRecord(final):r)};
 for(const {category,row} of plan.rows)next[category]=[...(next[category]||[]),{...row,id:newId()}];
 return {data:validateDemoData(next),added:plan.rows.length,duplicates:plan.duplicates.length};
}
