import React,{useState} from 'react';
import {addKegStock} from './lib/stockCatalog.js';
export default function KegCreator({data,onSave,readOnly=false}){
 const [brand,setBrand]=useState(''),[capacity,setCapacity]=useState('30'),[status,setStatus]=useState('');
 return <details className="festapp-optional-tool stock-keg-creator"><summary>🍺 Ajouter une bière en fût (marque / contenance)</summary>
  <div className="shopping-supplier-tools"><label>Marque / nom de la bière<input value={brand} maxLength={80} onChange={e=>setBrand(e.target.value)} placeholder="Ex. blonde, IPA, marque…" disabled={readOnly}/></label><label>Contenance<select value={capacity} onChange={e=>setCapacity(e.target.value)} disabled={readOnly}><option value="20">20 L</option><option value="30">30 L</option></select></label><button type="button" disabled={readOnly||!brand.trim()} onClick={()=>{try{onSave(addKegStock(data,{brand,capacity,newId:()=>crypto.randomUUID()}));setStatus('✓ Fiche créée dans Stock et Courses.');setBrand('');}catch(e){setStatus('⚠ '+e.message);}}}>Créer la vignette</button></div>{status&&<p role="status">{status}</p>}
 </details>;
}
