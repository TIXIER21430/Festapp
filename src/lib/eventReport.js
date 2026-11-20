import {financeKind,parseFinanceCents} from './eventEditions.js';
import {listTillSales} from './tillSales.js';

// Reuse existing, backed-up feedback and finance records. An event report never
// creates an untracked parallel store or infers a link from a similar name.
export const REPORT_NOTE_TYPES=[
 'Point fort','Point faible','Matériel à acheter','Quantité utilisée',
 'Date prochaine réunion','Prochaines manifestations','À ajouter au compte rendu'
];

const normalized=value=>String(value||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
const fixed=value=>String(value??'').trim();

export function createReportNote({id,eventId,type,subject,details}={}){
 if(typeof id!=='string'||!id||typeof eventId!=='string'||!eventId||eventId.length>200)throw new TypeError('Référence de fête invalide.');
 if(!REPORT_NOTE_TYPES.includes(type))throw new TypeError('Rubrique de compte rendu invalide.');
 const title=fixed(subject),body=fixed(details);
 if(!title||title.length>200||body.length>20000)throw new RangeError('Précise un sujet de 200 caractères maximum et une note de 20 000 caractères maximum.');
 return {id,eventId,values:[title,type,body]};
}

export function createPendingReportExpense({id,eventId,label,amount}={}){
 if(typeof id!=='string'||!id||typeof eventId!=='string'||!eventId||eventId.length>200)throw new TypeError('Référence de fête invalide.');
 const title=fixed(label),cents=parseFinanceCents(amount);
 if(!title||title.length>200||cents===null||cents<=0||cents>100_000_000)throw new RangeError('Précise le libellé et un montant positif de 1 000 000 € maximum.');
 return {id,eventId,values:[title,(cents/100).toFixed(2),'Dépense · Facture en attente (provisoire)']};
}

function saleQuantities(finance,eventId){
 const quantities=new Map(),unreadable=[];
 for(const sale of listTillSales(finance,eventId)){
  if(sale.cancelled)continue;
  const separator=sale.title.indexOf(' · ');
  if(separator<0){unreadable.push(sale.title);continue;}
  const details=sale.title.slice(separator+3).split(', ');
  for(const part of details){
   const parsed=part.match(/^(.+?) × ([1-9]\d{0,3})$/u);
   if(!parsed){unreadable.push(part);continue;}
   const name=parsed[1].trim(),key=normalized(name),count=Number(parsed[2]);
   const previous=quantities.get(key)||{name,quantity:0};
   previous.quantity+=count;quantities.set(key,previous);
  }
 }
 return {items:[...quantities.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr')),unreadable};
}

export function buildEventReport(data,eventId){
 const event=(data?.events||[]).find(row=>row?.id===eventId);
 if(!event||!event.values?.[0])throw new TypeError('Sélectionne une fête existante pour son compte rendu.');
 const byEvent=key=>(Array.isArray(data[key])?data[key]:[]).filter(row=>row?.eventId===eventId&&Array.isArray(row.values));
 const finance=byEvent('finance'),notes=byEvent('feedback'),shopping=byEvent('shopping');
 const sections=Object.fromEntries(REPORT_NOTE_TYPES.map(type=>[type,[]]));
 const otherNotes=[];
 for(const row of notes){
  const item={subject:fixed(row.values[0]),details:fixed(row.values[2])};
  const type=REPORT_NOTE_TYPES.find(value=>normalized(value)===normalized(row.values[1]));
  if(type)sections[type].push(item);
  else otherNotes.push({...item,type:fixed(row.values[1])});
 }
 const entries=[],pending=[],unclassified=[];
 let revenueCents=0,expenseCents=0,pendingExpenseCents=0;
 for(const row of finance){
  const amountCents=parseFinanceCents(row.values[1]),kind=financeKind(row);
  const entry={label:fixed(row.values[0]),nature:fixed(row.values[2]),amountCents};
  if(amountCents===null||kind==='unknown'){unclassified.push(entry);continue;}
  entries.push({...entry,kind});
  if(kind==='revenue')revenueCents+=amountCents;
  else{
   expenseCents+=amountCents;
   if(/facture\s+en\s+attente|provisoir|estim/i.test(normalized(row.values[2]))){pending.push(entry);pendingExpenseCents+=amountCents;}
  }
 }
 const quantities=saleQuantities(finance,eventId);
 return {
  event:{id:event.id,name:fixed(event.values[0]),date:fixed(event.values[1]),place:fixed(event.values[2])},
  finance:{entries,revenueCents,expenseCents,balanceCents:revenueCents-expenseCents,pending,pendingExpenseCents,unclassified},
  quantities,shopping:shopping.map(row=>({article:fixed(row.values[0]),quantity:fixed(row.values[1]),status:fixed(row.values[2])})),
  sections,otherNotes,taskCount:byEvent('tasks').length
 };
}
