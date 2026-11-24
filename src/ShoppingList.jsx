import React,{useState,useEffect,useRef} from 'react';
import StockIllustration from './StockIllustration.jsx';
import {purchaseCatalog,inPurchaseScope,isPurchased,isTransferred,setPurchaseQuantity,setPurchaseChecked,removePurchase,preparePurchaseTransfer,purchaseFingerprint,transferPurchases,quantity,productKey} from './lib/purchaseStock.js';

export default function ShoppingList({data,scope='',events=[],filter='',readOnly=false,onSave,onScope}){
 const [status,setStatus]=useState('');
 const [review,setReview]=useState(null);
 const [onlyList,setOnlyList]=useState(false);
 const reviewRef=useRef(null);
 const reviewing=!!review;
 useEffect(()=>{if(reviewing)reviewRef.current?.scrollIntoView({behavior:'smooth',block:'start'});},[reviewing]);
 const products=purchaseCatalog(data,scope);
 const active=products.filter(p=>p.row);
 const checked=active.filter(p=>isPurchased(p.row));
 const history=(data.shopping||[]).filter(r=>inPurchaseScope(r,scope)&&isTransferred(r));
 const visible=products.filter(p=>(!onlyList||p.row)&&productKey(p.name).includes(productKey(filter)));
 const id=()=>crypto.randomUUID();
 const save=next=>{if(readOnly)return;try{onSave(next);setStatus('');}catch(e){setStatus('⚠ '+e.message);}};
 const change=fn=>{try{save(fn());}catch(e){setStatus('⚠ '+e.message);}};
 function startReview(){
  try{
   const lines=preparePurchaseTransfer(data,scope);
   setReview({lines,fingerprint:purchaseFingerprint(data,scope),actual:Object.fromEntries(lines.map(l=>[l.id,l.actual])),opening:{}});
   setStatus('');
  }catch(e){setStatus('⚠ '+e.message);}
 }
 function confirmTransfer(){
  if(readOnly||!review)return;
  try{
   const next=transferPurchases(data,{scope,actual:review.actual,opening:review.opening,fingerprint:review.fingerprint,newId:id,date:new Date().toISOString().slice(0,10)});
   onSave(next);setReview(null);setStatus('✓ '+review.lines.length+' ligne(s) transférée(s) au stock. Les autres restent à acheter.');
  }catch(e){setStatus('⚠ '+e.message);}
 }
 return <section className="festapp-shopping" aria-label="Liste de courses">
  <label>Liste de courses<select value={scope} onChange={e=>{setReview(null);setStatus('');onScope(e.target.value);}}><option value="">Courses générales du comité</option>{events.map(e=><option key={e.id} value={e.id}>{e.values[0]}</option>)}</select></label>
  <p className="note">Indique la quantité à acheter directement sur les vignettes. Coche les produits achetés. Les quantités doivent utiliser la même unité que le stock (bouteilles, paquets, kg…).</p>
  <div className="shopping-toolbar"><button type="button" className="secondary" onClick={()=>onScope(scope,true)}>← Stock</button><strong>{active.length} article(s) · {checked.length} acheté(s)</strong><button type="button" className="secondary" onClick={()=>setOnlyList(v=>!v)}>{onlyList?'Voir tout le catalogue':'Voir ma liste uniquement'}</button></div>
  <div className="shopping-grid">{visible.map(p=>{
   const row=p.row;
   return <article className={'shopping-product'+(row&&isPurchased(row)?' purchased':'')} key={p.key}>
    <StockIllustration name={p.name}/>
    <div className="shopping-product-copy"><strong>{p.name}</strong><label>Quantité<input aria-label={'Quantité à acheter : '+p.name} inputMode="decimal" value={row?.values[1]||''} placeholder="—" disabled={readOnly||!!review} onChange={e=>change(()=>setPurchaseQuantity(data,{scope,rowId:row?.id,name:p.name,value:e.target.value,newId:id}))}/></label>
     {row&&<div className="shopping-row-actions"><label><input type="checkbox" checked={isPurchased(row)} disabled={readOnly||!!review||!(quantity(row.values[1])>0)} onChange={e=>change(()=>setPurchaseChecked(data,{scope,rowId:row.id,checked:e.target.checked}))}/> Acheté</label><button type="button" className="secondary" disabled={readOnly||!!review} aria-label={'Retirer '+p.name} onClick={()=>{if(window.confirm('Retirer '+p.name+' de cette liste ?'))change(()=>removePurchase(data,{scope,rowId:row.id}));}}>✕</button></div>}
    </div>
   </article>;
  })}</div>
  {!visible.length&&<p>Aucun article à afficher.</p>}
  {!review&&<div className="shopping-transfer-bar"><button type="button" disabled={readOnly||!checked.length||!!review} onClick={startReview}>Transférer au stock ({checked.length})</button></div>}
  {review&&<section ref={reviewRef} className="shopping-review" aria-label="Vérifier le transfert">
   <h3>Vérifier les quantités réellement achetées</h3><p>Corrige les quantités avant de confirmer. Le stock existant sera augmenté, jamais remplacé.</p>
   {review.lines.map((line,i)=><div className="shopping-review-row" key={line.id}>
    <strong>{line.name}</strong><label>Quantité réellement achetée<input inputMode="decimal" value={review.actual[line.id]} onChange={e=>setReview(r=>({...r,actual:{...r.actual,[line.id]:e.target.value}}))}/></label>
    {line.current===null&&review.lines.findIndex(l=>l.key===line.key)===i&&<label>Stock actuel (à vérifier, 0 si aucun)<input inputMode="decimal" value={review.opening[line.key]??''} onChange={e=>setReview(r=>({...r,opening:{...r.opening,[line.key]:e.target.value}}))}/></label>}
    {line.current!==null&&<small>Stock avant achat : {line.current}</small>}
   </div>)}
   <button type="button" disabled={readOnly} onClick={confirmTransfer}>Confirmer l’entrée en stock</button> <button type="button" className="secondary" onClick={()=>{setReview(null);setStatus('');}}>Annuler / modifier la liste</button>
  </section>}
  {status&&<p role="status" className="note">{status}</p>}
  {history.length>0&&<details className="festapp-optional-tool"><summary>Historique des achats transférés ({history.length})</summary>{history.map(r=><p key={r.id}><strong>{r.values[0]}</strong> · {r.values[1]} · {r.values[2]}</p>)}</details>}
 </section>;
}
