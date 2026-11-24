import React,{useState,useEffect,useRef} from 'react';
import StockIllustration from './StockIllustration.jsx';
import KegCreator from './KegCreator.jsx';
import {STOCK_GROUPS,stockGroup,stockUnit} from './lib/stockCatalog.js';
import {SUPPLIERS,supplierFor,supplierCategory,assignPurchaseSupplier,shoppingExportGroups,shoppingExportText,shoppingMailto} from './lib/shoppingSuppliers.js';
import {makeShoppingDocx} from './lib/reportDocx.js';
import {purchaseCatalog,inPurchaseScope,isPurchased,isTransferred,setPurchaseQuantity,setPurchaseChecked,removePurchase,preparePurchaseTransfer,purchaseFingerprint,transferPurchases,quantity,productKey} from './lib/purchaseStock.js';

export default function ShoppingList({data,scope='',events=[],filter='',readOnly=false,onSave,onScope}){
 const [status,setStatus]=useState('');
 const [review,setReview]=useState(null);
 const [onlyList,setOnlyList]=useState(false);
 const [groupFilter,setGroupFilter]=useState('all');
 const [supplierFilter,setSupplierFilter]=useState('all');
 const [choices,setChoices]=useState({});
 const [exportDraft,setExportDraft]=useState(null);
 const [exportBusy,setExportBusy]=useState(false);
 const exportRef=useRef(null);
 const exporting=!!exportDraft;
 useEffect(()=>{if(exporting)exportRef.current?.scrollIntoView({behavior:'smooth',block:'start'});},[exporting]);
 const reviewRef=useRef(null);
 const reviewing=!!review;
 useEffect(()=>{if(reviewing)reviewRef.current?.scrollIntoView({behavior:'smooth',block:'start'});},[reviewing]);
 const products=purchaseCatalog(data,scope);
 const active=products.filter(p=>p.row);
 const checked=active.filter(p=>isPurchased(p.row));
 const history=(data.shopping||[]).filter(r=>inPurchaseScope(r,scope)&&isTransferred(r));
 const supplierOf=p=>p.row?supplierFor(p.row):choices[p.key]||supplierFor(null,p.name);
 const visible=products.filter(p=>(groupFilter==='all'||stockGroup(p.name)===groupFilter)&&(!onlyList||p.row)&&productKey(p.name).includes(productKey(filter))&&(supplierFilter==='all'||supplierCategory(supplierOf(p))===supplierFilter));
 const eventName=events.find(e=>e.id===scope)?.values[0]||'Courses générales du comité';
 const exportGroups=shoppingExportGroups(active.map(p=>p.row),{supplierFilter});
 function editSupplier(p,value){
  if(readOnly||review)return;
  if(p.row)change(()=>assignPurchaseSupplier(data,{scope,rowId:p.row.id,supplier:value}));
  else setChoices(c=>({...c,[p.key]:value}));
 }
 function openExport(){
  if(!exportGroups.length){setStatus('Aucun article restant à acheter pour cette sélection.');return;}
  setExportDraft({subject:'Liste de courses – '+eventName+(supplierFilter==='all'?'':' – '+supplierFilter),body:shoppingExportText(exportGroups,eventName),recipient:''});
  setStatus('');
 }
 async function downloadList(){
  if(exportBusy||!exportDraft)return;
  setExportBusy(true);
  try{
   const blob=await makeShoppingDocx({text:exportDraft.body});
   const url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='FESTAPP-liste-de-courses.docx';document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(e){setStatus('⚠ '+e.message);}finally{setExportBusy(false);}
 }
 function emailList(){
  try{window.location.href=shoppingMailto(exportDraft);setStatus('Le message est préparé dans ta messagerie. Vérifie-le puis envoie-le.');}
  catch(e){setStatus('⚠ '+e.message);}
 }
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
  <p className="note">Indique librement les quantités (décimales possibles). Coche les produits achetés. Utilise toujours la même unité que le stock ; les unités affichées sont des repères. Pour les fûts et les cubis, indique le nombre de contenants, pas les litres.</p>
  <div className="shopping-toolbar"><button type="button" className="secondary" onClick={()=>onScope('',true)}>← Stock général</button><strong>{active.length} article(s) · {checked.length} acheté(s)</strong><button type="button" className="secondary" onClick={()=>setOnlyList(v=>!v)}>{onlyList?'Voir tout le catalogue':'Voir ma liste uniquement'}</button></div>
  <div className="shopping-supplier-tools"><label>Afficher les fournisseurs<select value={supplierFilter} onChange={e=>{setSupplierFilter(e.target.value);setExportDraft(null);}}><option value="all">Tous les fournisseurs</option>{SUPPLIERS.map(s=><option key={s}>{s}</option>)}</select></label><button type="button" className="secondary" disabled={!exportGroups.length||!!review} onClick={openExport}>📄 Éditer / envoyer la liste</button></div>
  {exportDraft&&<section ref={exportRef} className="shopping-review" aria-label="Éditer la liste de courses">
   <h3>Liste à transmettre</h3><p>Uniquement les articles restant à acheter, regroupés par fournisseur. Le texte peut être modifié sans changer les quantités enregistrées.</p>
   <label>Destinataire (facultatif)<input type="email" value={exportDraft.recipient} onChange={e=>setExportDraft(d=>({...d,recipient:e.target.value}))} placeholder="Adresse e-mail"/></label>
   <label>Objet<input value={exportDraft.subject} onChange={e=>setExportDraft(d=>({...d,subject:e.target.value}))}/></label>
   <label>Liste<textarea rows={12} value={exportDraft.body} onChange={e=>setExportDraft(d=>({...d,body:e.target.value}))}/></label>
   <div className="shopping-toolbar"><button type="button" onClick={emailList}>✉ Envoyer par mail</button><button type="button" className="secondary" disabled={exportBusy} onClick={downloadList}>Télécharger Word</button><button type="button" className="secondary" onClick={()=>{navigator.clipboard?.writeText(exportDraft.body).then(()=>setStatus('Liste copiée.')).catch(()=>setStatus('Sélectionne et copie le texte manuellement.'));}}>Copier</button><button type="button" className="secondary" onClick={()=>setExportDraft(null)}>Fermer</button></div>
  </section>}
  <KegCreator data={data} onSave={onSave} readOnly={readOnly||!!review}/>
  <label>Famille de produits<select value={groupFilter} onChange={e=>setGroupFilter(e.target.value)}><option value="all">Toutes les familles</option>{STOCK_GROUPS.map(g=><option key={g}>{g}</option>)}</select></label>
  <div className="shopping-grid">{visible.map((p,i)=>{
   const row=p.row,supplier=supplierOf(p);
   return <React.Fragment key={p.key}>{(i===0||stockGroup(visible[i-1].name)!==stockGroup(p.name))&&<h3 className="stock-group-heading">{stockGroup(p.name)}</h3>}<article className={'shopping-product'+(row&&isPurchased(row)?' purchased':'')} key={p.key}>
    <StockIllustration name={p.name}/>
    <div className="shopping-product-copy"><strong>{p.name}</strong><label>Quantité{stockUnit(p.name)?' ('+stockUnit(p.name)+')':''}<input aria-label={'Quantité à acheter : '+p.name} inputMode="decimal" value={row?.values[1]||''} placeholder="—" disabled={readOnly||!!review} onChange={e=>change(()=>setPurchaseQuantity(data,{scope,rowId:row?.id,name:p.name,value:e.target.value,newId:id,supplier}))}/></label>
     <label className="shopping-supplier-label">Fournisseur<select aria-label={'Fournisseur : '+p.name} value={supplierCategory(supplier)} disabled={readOnly||!!review} onChange={e=>editSupplier(p,e.target.value)}>{SUPPLIERS.map(s=><option key={s}>{s}</option>)}</select></label>
     {supplierCategory(supplier)==='Autre'&&<input aria-label={'Autre fournisseur : '+p.name} placeholder="Préciser (facultatif)" maxLength={110} disabled={readOnly||!!review} key={p.key+':other'} defaultValue={supplier.startsWith('Autre : ')?supplier.slice(8):''} onBlur={e=>{const value=e.target.value.trim();editSupplier(p,value?'Autre : '+value:'Autre');}}/>}
     {row&&<div className="shopping-row-actions"><label><input type="checkbox" checked={isPurchased(row)} disabled={readOnly||!!review||!(quantity(row.values[1])>0)} onChange={e=>change(()=>setPurchaseChecked(data,{scope,rowId:row.id,checked:e.target.checked}))}/> Acheté</label><button type="button" className="secondary" disabled={readOnly||!!review} aria-label={'Retirer '+p.name} onClick={()=>{if(window.confirm('Retirer '+p.name+' de cette liste ?'))change(()=>removePurchase(data,{scope,rowId:row.id}));}}>✕</button></div>}
    </div>
   </article></React.Fragment>;
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
  {history.length>0&&<details className="festapp-optional-tool"><summary>Historique des achats transférés ({history.length})</summary>{history.map(r=><p key={r.id}><strong>{r.values[0]}</strong> · {r.values[1]} · {supplierFor(r)} · {r.values[2]}</p>)}</details>}
 </section>;
}
