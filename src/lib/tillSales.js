import {calculateTill} from './quickTill.js';

const PAYMENT_LABELS={especes:'Espèces',carte:'Carte (paiement externe)'};
const SALE_PREFIX='Vente caisse · ';
const CORRECTION_PREFIX='Annulation caisse · ';

export function isTillAccountingRecord(record){
 const label=record?.values?.[0];
 return typeof label==='string'&&(label.startsWith(SALE_PREFIX)||label.startsWith(CORRECTION_PREFIX));
}

function saleCents(record){
 const amount=record?.values?.[1];
 if(typeof amount!=='string'||!/^\d+(?:[.,]\d{1,2})?$/.test(amount))return null;
 const cents=Math.round(Number(amount.replace(',','.'))*100);
 return Number.isSafeInteger(cents)&&cents>0?cents:null;
}

export function listTillSales(finance,eventId){
 const rows=Array.isArray(finance)?finance:[];
 const cancelled=new Set(rows.filter(record=>record?.eventId===eventId&&record?.values?.[0]?.startsWith(CORRECTION_PREFIX))
  .filter(record=>{
   const originalId=String(record.values[0]).slice(CORRECTION_PREFIX.length).split(' · ')[0];
   const original=rows.find(row=>row?.eventId===eventId&&row?.id===originalId&&row?.values?.[0]?.startsWith(SALE_PREFIX));
   const cents=saleCents(original);
   return cents!==null&&record.values[1]===(-cents/100).toFixed(2)&&record.values[2]===`Correction · ${original.values[2]}`;
  }).map(record=>String(record.values[0]).slice(CORRECTION_PREFIX.length).split(' · ')[0]));
 return rows.filter(record=>record?.eventId===eventId&&record?.values?.[0]?.startsWith(SALE_PREFIX)&&saleCents(record)!==null)
  .map(record=>({id:record.id,title:record.values[0].slice(SALE_PREFIX.length),amountCents:saleCents(record),method:record.values[2],cancelled:cancelled.has(record.id)}))
  .reverse();
}

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
 for(const sale of listTillSales(finance,eventId)){
  if(sale.cancelled)continue;
  count++;totalCents+=sale.amountCents;
 }
 return {count,totalCents};
}

// Append a negative correction in the finance ledger; never erase or edit a sale.
export function createTillCorrectionRecord({id,eventId,saleId,finance,at}={}){
 if(typeof id!=='string'||!id||typeof eventId!=='string'||!eventId||eventId.length>200)throw new TypeError('Référence de correction invalide.');
 if(typeof saleId!=='string'||!/^[a-zA-Z0-9-]{1,128}$/.test(saleId))throw new TypeError('Référence de vente invalide.');
 if(typeof at!=='string'||!Number.isFinite(Date.parse(at)))throw new TypeError('Date de correction invalide.');
 if((finance||[]).some(row=>row?.id===id))throw new Error('La référence de correction existe déjà.');
 const original=(finance||[]).find(row=>row?.id===saleId&&row?.eventId===eventId);
 const sale=listTillSales(finance,eventId).find(row=>row.id===saleId);
 if(!original||!sale)throw new Error('Vente introuvable pour cette manifestation.');
 if(sale.cancelled)throw new Error('Cette vente est déjà annulée.');
 const date=new Date(at).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Paris'});
 return {id,eventId,values:[`${CORRECTION_PREFIX}${saleId} · ${date}`,(-sale.amountCents/100).toFixed(2),`Correction · ${original.values[2]}`]};
}
