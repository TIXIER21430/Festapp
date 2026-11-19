import {calculateTill} from './quickTill.js';

const PAYMENT_LABELS={especes:'Espèces',carte:'Carte (paiement externe)'};

// A local accounting *entry*, never a claim that an external SumUp payment ran.
export function createTillFinanceRecord({id,eventId,cart,products,method='especes',at}={}){
 if(typeof id!=='string'||!id||typeof eventId!=='string'||!eventId||eventId.length>200)throw new TypeError('Manifestation ou référence de vente invalide.');
 if(!Object.hasOwn(PAYMENT_LABELS,method))throw new TypeError('Mode de règlement invalide.');
 if(typeof at!=='string'||!Number.isFinite(Date.parse(at)))throw new TypeError('Date de vente invalide.');
 const total=calculateTill(cart,products);
 if(total<=0)throw new RangeError('Ajoutez au moins un article payant.');
 const items=Object.entries(cart).filter(([,q])=>q>0).map(([productId,quantity])=>{
  const product=products.find(p=>p.id===productId);
  return `${product.name} × ${quantity}`;
 });
 const date=new Date(at).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Paris'});
 return {id,eventId,values:[
  `Vente caisse · ${date} · ${items.join(', ')}`,
  (total/100).toFixed(2),
  `Recette · ${PAYMENT_LABELS[method]}`
 ]};
}

export function summarizeTillSales(finance,eventId){
 let count=0,totalCents=0;
 for(const record of finance||[]){
  if(record.eventId!==eventId||!record.values?.[0]?.startsWith('Vente caisse · '))continue;
  const amount=record.values[1];
  if(!/^\d+(?:[.,]\d{1,2})?$/.test(amount))continue;
  const cents=Math.round(Number(amount.replace(',','.'))*100);
  if(!Number.isSafeInteger(cents))continue;
  count++;totalCents+=cents;
 }
 return {count,totalCents};
}
