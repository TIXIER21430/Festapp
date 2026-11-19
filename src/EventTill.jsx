import React,{useState} from 'react';
import {TILL_PRODUCTS,calculateTill,changeQuantity} from './lib/quickTill.js';

// The event till records a local finance entry; actual payments remain external.
export default function EventTill({eventName,onClose,products,cart,setCart,onRecordSale,saleStatus,saleSummary,readOnly=false,editing,onToggleEdit,draft,setDraft,onSave,configWarning,configReadOnly,onImport,importRef,onImportFile}){
 const [paymentMethod,setPaymentMethod]=useState('especes');
 const amount=calculateTill(cart,products);
 return <section className="panel event-till" aria-label="Caisse tactile">
  <button type="button" className="festapp-back-action" onClick={onClose}>← Retour à la fête</button>
  <div className="event-till-context"><span>🎉 Dans cette manifestation</span><strong>{eventName}</strong></div>
  <div className="heading"><h2>🧾 Caisse / SumUp</h2><span className="demo">Suivi local</span></div>
  <p className="festapp-till-warning">⚠ Les paiements par carte se font séparément dans SumUp. FEST’APP note les recettes sur cet appareil ; elle n’encaisse rien elle-même.</p>
  <div className="till-grid">{products.map(p=><button type="button" className="till-product" key={p.id} onClick={()=>setCart(c=>changeQuantity(c,p.id,1,products))}><span className="till-icon">{p.icon}</span><strong>{p.name}</strong><span>{(p.priceCents/100).toFixed(2).replace('.',',')} €</span><span>× {cart[p.id]||0}</span></button>)}</div>
  <div className="heading"><strong>Total du panier : {(amount/100).toFixed(2).replace('.',',')} €</strong><button type="button" className="secondary" onClick={()=>setCart({})}>Vider le panier</button></div>
  <div className="till-actions">{TILL_PRODUCTS.filter(p=>cart[p.id]>0).map(p=><button type="button" className="secondary" key={p.id} onClick={()=>setCart(c=>changeQuantity(c,p.id,-1,products))}>− 1 {p.name}</button>)}</div>
  <div className="festapp-till-sale"><label>Règlement déjà reçu<select value={paymentMethod} onChange={event=>setPaymentMethod(event.target.value)}><option value="especes">💶 Espèces</option><option value="carte">💳 Carte — encaissée dans SumUp</option></select></label><button type="button" disabled={readOnly||amount<=0} onClick={()=>onRecordSale(paymentMethod)}>✅ Enregistrer cette vente</button><small>À utiliser seulement après avoir reçu le paiement. Une recette sera ajoutée au bilan de {eventName}.</small>{saleStatus&&<p role="status">{saleStatus}</p>}<p className="festapp-till-sale-total">📊 {saleSummary?.count||0} vente(s) notée(s) · {((saleSummary?.totalCents||0)/100).toFixed(2).replace('.',',')} € de recettes de caisse pour cette fête</p></div>
  <details className="festapp-till-settings"><summary>⚙ Produits et tarifs</summary>
   <button type="button" className="secondary" onClick={onToggleEdit}>{editing?'Fermer les réglages':'Personnaliser les produits et tarifs'}</button>
   {configWarning&&<p role="status">{configWarning}</p>}
   {editing&&<div className="note"><h3>Produits de cette manifestation</h3>{draft.map((p,i)=><div key={p.id} className="fields"><label><input type="checkbox" checked={p.enabled} onChange={e=>setDraft(old=>old.map((x,j)=>j===i?{...x,enabled:e.target.checked}:x))}/> {TILL_PRODUCTS.find(x=>x.id===p.id).name}</label><label>Prix (€)<input inputMode="decimal" value={p.price} onChange={e=>setDraft(old=>old.map((x,j)=>j===i?{...x,price:e.target.value}:x))}/></label></div>)}<button type="button" disabled={configReadOnly} onClick={onSave}>Enregistrer ce menu</button></div>}
   <div className="till-actions"><button type="button" className="secondary" onClick={onImport}>Importer les menus</button><input type="file" ref={importRef} accept=".json,application/json" style={{display:'none'}} onChange={onImportFile}/></div>
  </details>
  <p className="note">Enregistrement local uniquement : vérifie les recettes et conserve une sauvegarde ZIP. La caisse ne remplace pas le terminal SumUp et ne synchronise pas encore les ventes entre les téléphones.</p>
 </section>;
}
