import React,{useMemo,useState} from 'react';
import {planBulkEntry} from './lib/bulkEntry.js';

export default function BulkEntry({category,fields,records,eventId,readOnly,onAppend}){
 const [text,setText]=useState('');
 const [status,setStatus]=useState('');
 const preview=useMemo(()=>{
  try{return {value:planBulkEntry(text,{category,fields,existing:records,eventId}),error:''};}
  catch(e){return {value:null,error:e.message};}
 },[text,category,records,eventId,fields]);
 function commit(){
  if(readOnly||!preview.value||preview.value.errors.length||!preview.value.rows.length)return;
  try{const count=onAppend(preview.value.rows);setStatus(`✅ ${count} fiche(s) ajoutée(s), sans suppression ni remplacement.`);setText('');}
  catch(e){setStatus('⚠ Aucun ajout : '+e.message);}
 }
 return <details className="bulk-entry"><summary>⚡ Ajouter plusieurs fiches en une fois (Excel / copier-coller)</summary>
  <p>Copie tes lignes depuis Excel, ou saisis une fiche par ligne avec <strong>3 colonnes séparées par un point-virgule</strong>. Le collage reste sur cet appareil.</p>
  <p className="bulk-example">{fields.join(' ; ')}</p>
  <textarea rows={6} value={text} disabled={readOnly} onChange={e=>{setText(e.target.value);setStatus('');}} placeholder={`${fields[0]} ; ${fields[1]} ; ${fields[2]}\nExemple ; 12 ; À vérifier`} aria-label={'Coller des lignes pour '+category}/>
  {preview.error&&<p role="alert">⚠ {preview.error}</p>}
  {preview.value&&text.trim()&&<><p role="status">{preview.value.rows.length} nouvelle(s) fiche(s) · {preview.value.duplicates} doublon(s) écarté(s) · {preview.value.errors.length} ligne(s) à corriger.</p>
   {preview.value.errors.length>0&&<ul className="bulk-errors">{preview.value.errors.slice(0,10).map((err,i)=><li key={i}>{err}</li>)}</ul>}
   {!!preview.value.rows.length&&<div className="bulk-preview">{preview.value.rows.slice(0,5).map((values,i)=><div key={i}>{values.filter(Boolean).join(' · ')}</div>)}{preview.value.rows.length>5&&<small>… et {preview.value.rows.length-5} autres lignes.</small>}</div>}
  </>}
  <button type="button" disabled={readOnly||!preview.value?.rows.length||preview.value.errors.length>0} onClick={commit}>➕ Confirmer l’ajout des lignes</button>
  {status&&<p role="status">{status}</p>}
 </details>;
}
