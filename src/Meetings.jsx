import React,{useState} from 'react';
import {MEETING_SECTIONS,newMeeting,readMeeting,saveMeetingDraft,planMeeting,finalizeMeeting,classifyMeetingNotes} from './lib/meetings.js';
import {makeMeetingDocx} from './lib/reportDocx.js';
const localDate=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');};
export default function Meetings({data,onSave,readOnly,onClose}){
 const [selected,setSelected]=useState(''),[preview,setPreview]=useState(false),[message,setMessage]=useState('');
 const meetings=(data.archives||[]).map(readMeeting).filter(Boolean).sort((a,b)=>b.date.localeCompare(a.date));
 const m=meetings.find(x=>x.id===selected);
 const events=data.events||[];
 const name=id=>events.find(r=>r.id===id)?.values[0]||'';
 const update=next=>{try{onSave(saveMeetingDraft(data,next));setPreview(false);setMessage('');return true;}catch(e){setMessage(e.message);return false;}};
 const create=()=>{const next=newMeeting(crypto.randomUUID(),localDate());if(update(next))setSelected(next.id);};
 const patch=fields=>update({...m,...fields});
 const plan=m&&m.status==='draft'?planMeeting(data,m):null;
 const finish=()=>{try{const result=finalizeMeeting(data,m.id,()=>crypto.randomUUID());onSave(result.data);setPreview(false);setMessage(result.added+' fiche(s) ajoutée(s), '+result.duplicates+' doublon(s) évité(s).');}catch(e){setMessage(e.message);}};
 const download=async()=>{try{const blob=await makeMeetingDocx({date:m.date,eventName:m.eventName||name(m.eventId),previousName:m.previousName||name(m.previousId),nextDate:m.nextDate,sections:MEETING_SECTIONS.map(([key,label])=>({label,text:m.notes[key]})),draft:m.status!=='final'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='FESTAPP-reunion-'+m.date+'.docx';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);}catch(e){setMessage(e.message);}};
 const locked=readOnly||m?.status==='final';
 return <section className="panel festapp-meetings" aria-label="Réunions du comité">
  <div className="heading"><h2>📝 Réunions du comité</h2><button type="button" className="secondary" onClick={onClose}>← Retour</button></div>
  {!m?<><p>Une seule page pour préparer, décider et faire le bilan. Les notes sont sauvegardées automatiquement.</p><button type="button" disabled={readOnly} onClick={create}>＋ Nouvelle réunion</button><div className="meeting-history">{meetings.map(x=><button type="button" className="secondary" key={x.id} onClick={()=>{setSelected(x.id);setPreview(false);setMessage('');}}><strong>Réunion du {x.date.split('-').reverse().join('/')}</strong><small>{x.status==='draft'?'Brouillon à reprendre':'Compte rendu validé'}</small></button>)}</div></>:<>
  <button type="button" className="secondary" onClick={()=>{setSelected('');setPreview(false);setMessage('');}}>← Toutes les réunions</button>
  <p className="note">{locked?'Compte rendu en lecture seule.':'Écris une idée par ligne. Tu peux quitter et reprendre la réunion. Rien ne sera ajouté aux fiches avant validation.'}</p>
  <div className="meeting-grid"><label>Date de réunion<input type="date" value={m.date} disabled={locked} onChange={e=>{if(e.target.value)patch({date:e.target.value});}}/></label>
  <label>Manifestation à préparer<select value={m.eventId} disabled={locked} onChange={e=>patch({eventId:e.target.value})}><option value="">Choisir une manifestation</option>{events.map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label>
  <label>Manifestation précédente (bilan)<select value={m.previousId} disabled={locked} onChange={e=>patch({previousId:e.target.value})}><option value="">Choisir une manifestation</option>{events.map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label>
  <label>Date de la prochaine réunion<input type="date" value={m.nextDate} disabled={locked} onChange={e=>patch({nextDate:e.target.value})}/></label></div>
  <div className="meeting-grid">{MEETING_SECTIONS.map(([key,label,hint])=><label key={key} className={'meeting-field '+(key==='free'?'meeting-wide':'')}><strong>{label}</strong><textarea rows={key==='free'?7:4} disabled={locked} placeholder={hint} value={m.notes[key]} onChange={e=>patch({notes:{...m.notes,[key]:e.target.value}})}/>{key==='free'&&!locked&&<><small>Tu peux écrire librement. Pour classer automatiquement, commence une ligne par Avant :, Pendant :, Après :, Courses :, Matériel :, Général :, Point fort :, Point faible :, Quantités : ou Bénévoles :. Les autres notes restent ici.</small><button type="button" className="secondary" onClick={()=>{const result=classifyMeetingNotes(m);if(update(result.meeting))setMessage(result.count+' ligne(s) classée(s).');}}>↪ Classer les notes identifiées</button></>}</label>)}</div>
  {!locked&&<><button type="button" onClick={()=>{setPreview(true);setMessage('');}}>Vérifier et répartir les informations</button>{preview&&<div className="meeting-preview"><h3>{plan.rows.length} fiche(s) à ajouter</h3>{plan.errors.map((e,i)=><p role="alert" key={i}>⚠ {e}</p>)}{plan.duplicates.length>0&&<p>{plan.duplicates.length} doublon(s) ignoré(s).</p>}{plan.rows.map((r,i)=><p key={i}>{r.label}</p>)}{m.notes.free.trim()&&<p>Les notes libres restent dans le compte rendu.</p>}<button type="button" disabled={!!plan.errors.length} onClick={finish}>✓ Valider la réunion et répartir</button></div>}</>}
  <button type="button" className="secondary" onClick={download}>📄 Télécharger le compte rendu Word</button>
  </>}
  {message&&<p role="status" className="note">{message}</p>}
 </section>;
}
