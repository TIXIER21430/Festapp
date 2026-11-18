import React,{useMemo,useState} from 'react';
import {buildFreeAiPrompt} from './lib/freeAiPrompt.js';

export default function FreeAiHelper({events=[],recipes=[]}){
 const [kind,setKind]=useState('post');
 const [eventId,setEventId]=useState('');
 const [recipeId,setRecipeId]=useState('');
 const [servings,setServings]=useState('50');
 const [status,setStatus]=useState('');
 const event=events.find(r=>r.id===eventId)||events.find(r=>r.values?.[0]==='Marché de Noël 2026')||events[0];
 const recipe=recipes.find(r=>r.id===recipeId)||recipes[0];
 const result=useMemo(()=>{
  try{return {prompt:buildFreeAiPrompt({kind,event,recipe,servings}),error:''};}
  catch(error){return {prompt:'',error:error.message};}
 },[kind,event,recipe,servings]);
 async function copy(){
  if(!result.prompt)return;
  try{await navigator.clipboard.writeText(result.prompt);setStatus('✅ Question copiée. Ouvre ChatGPT et colle-la toi-même.');}
  catch{setStatus('⚠ Copie automatique indisponible. Sélectionne la question ci-dessous et copie-la manuellement.');}
 }
 return <section className="free-ai-helper" aria-label="Assistant IA gratuit sans abonnement">
  <div className="free-ai-heading"><span className="free-ai-icon" aria-hidden="true">🤖</span><div><span className="free-ai-label">IA GRATUITE · 0 € DÉPENSÉ PAR FEST’APP</span><h2>Un coup de main avec ChatGPT gratuit</h2><p>Prépare ta question ici, copie-la, puis ouvre ChatGPT. Aucun abonnement ni clé API n’est activé dans FEST’APP.</p></div></div>
  <div className="free-ai-controls"><label>Que veux-tu préparer ?<select value={kind} onChange={e=>{setKind(e.target.value);setStatus('');}}><option value="post">📣 Publication Facebook</option><option value="event">🎉 Organisation d’une fête</option><option value="recipe">🍲 Adapter une recette</option></select></label>
   {kind==='recipe'?<><label>Recette<select value={recipe?.id||''} onChange={e=>setRecipeId(e.target.value)}><option value="">{recipes.length?'Choisir une recette':'Aucune recette enregistrée'}</option>{recipes.map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label><label>Pour combien de personnes ?<input inputMode="numeric" type="number" min="1" max="10000" value={servings} onChange={e=>setServings(e.target.value)}/></label></>:<label>Manifestation<select value={event?.id||''} onChange={e=>setEventId(e.target.value)}>{events.map(r=><option key={r.id} value={r.id}>{r.values[0]}</option>)}</select></label>}
  </div>
  <label className="free-ai-prompt-label">Question préparée (modifiable après collage)<textarea value={result.prompt} readOnly rows={5} aria-label="Question préparée pour ChatGPT"/></label>
  {result.error&&<p role="alert">⚠ {result.error}</p>}
  <div className="free-ai-actions"><button type="button" onClick={copy} disabled={!result.prompt}>📋 Copier ma question</button><a href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">↗ Ouvrir ChatGPT gratuit</a></div>
  {status&&<p role="status">{status}</p>}
  <p className="free-ai-note">🔒 Rien n’est envoyé automatiquement à ChatGPT. <strong>Vérifie les données personnelles avant de coller une question ou une photo.</strong> L’IA peut se tromper : relis ses réponses et copie uniquement ce que tu valides dans FEST’APP. La version gratuite de ChatGPT a ses propres limites d’utilisation.</p>
 </section>;
}
