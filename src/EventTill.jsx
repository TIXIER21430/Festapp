import React from 'react';
import {TILL_PRODUCTS,calculateTill,changeQuantity} from './lib/quickTill.js';

// The demo till belongs to the selected event workspace, never the home page.
// It does not settle payments or persist individual cart transactions.
export default function EventTill({eventName,products,cart,setCart,editing,onToggleEdit,draft,setDraft,onSave,configWarning,configReadOnly,onExport,onImport,importRef,onImportFile}){
 return <section className="panel event-till" aria-label="Caisse tactile">
  <div className="event-till-context"><span>🎉 Dans cette manifestation</span><strong>{eventName}</strong></div>
  <div className="heading"><h2>🧾 Caisse / SumUp</h2><span className="demo">Essai sans paiement</span></div>
  <p>Menu de démonstration pour cette fête. Tarifs fictifs à vérifier. Le panier reste sur cet appareil ; aucun encaissement SumUp n’est déclenché.</p>
  <button type="button" className="secondary" onClick={onToggleEdit}>{editing?'Fermer les réglages':'⚙ Personnaliser produits et tarifs'}</button>
  {configWarning&&<p role="status">{configWarning}</p>}
  {editing&&<div className="note"><h3>Produits de cette manifestation</h3>{draft.map((p,i)=><div key={p.id} className="fields"><label><input type="checkbox" checked={p.enabled} onChange={e=>setDraft(old=>old.map((x,j)=>j===i?{...x,enabled:e.target.checked}:x))}/> {TILL_PRODUCTS.find(x=>x.id===p.id).name}</label><label>Prix (€)<input inputMode="decimal" value={p.price} onChange={e=>setDraft(old=>old.map((x,j)=>j===i?{...x,price:e.target.value}:x))}/></label></div>)}<button type="button" disabled={configReadOnly} onClick={onSave}>Enregistrer ce menu</button></div>}
  <div className="till-actions"><button type="button" className="secondary" onClick={onExport}>Exporter les menus</button><button type="button" className="secondary" onClick={onImport}>Importer les menus</button><input type="file" ref={importRef} accept=".json,application/json" style={{display:'none'}} onChange={onImportFile}/></div>
  <div className="till-grid">{products.map(p=><button type="button" className="till-product" key={p.id} onClick={()=>setCart(c=>changeQuantity(c,p.id,1,products))}><span className="till-icon">{p.icon}</span><strong>{p.name}</strong><span>{(p.priceCents/100).toFixed(2).replace('.',',')} €</span><span>× {cart[p.id]||0}</span></button>)}</div>
  <div className="heading"><strong>Total du panier : {(calculateTill(cart,products)/100).toFixed(2).replace('.',',')} €</strong><button type="button" className="secondary" onClick={()=>setCart({})}>Vider le panier</button></div>
  <div className="till-actions">{TILL_PRODUCTS.filter(p=>cart[p.id]>0).map(p=><button type="button" className="secondary" key={p.id} onClick={()=>setCart(c=>changeQuantity(c,p.id,-1,products))}>− 1 {p.name}</button>)}</div>
  <p className="note">Simulation uniquement : aucun paiement par carte ou espèces. Les ventes de ce panier ne sont pas comptabilisées dans le bilan financier. Ne pas l’utiliser pour une vraie caisse avant validation.</p>
 </section>;
}
