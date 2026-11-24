import {rentalTerms,rentalCatalog} from './rentalCatalog.js';
// Equipment loans are independent of inventory records. Reservations hold stock
// over an inclusive date range; an overdue checkout holds stock until returned.
const states=new Set(['draft','reserved','out','returned','cancelled']);
const dayRE=/^\d{4}-\d{2}-\d{2}$/;
export const localDay=(d=new Date())=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const validDay=s=>typeof s==='string'&&dayRE.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
const positiveInt=n=>Number.isSafeInteger(n)&&n>0&&n<=100000;
const cents=n=>Number.isSafeInteger(n)&&n>=0&&n<=100000000;
const clean=(s,max)=>typeof s==='string'&&s.length<=max;
export function equipmentQuantity(record){
 const raw=String(record?.values?.[1]??'').trim();
 const match=raw.match(/^(\d+)(?:\s*(?:u\.?|unités?|pièces?|pcs?))?$/i);
 return match&&Number.isSafeInteger(Number(match[1]))?Number(match[1]):null;
}
export function readLoan(row){
 if(!row||!Array.isArray(row.values)||row.values.length!==3||!states.has(row.values[1]))throw new Error('Mouvement matériel invalide.');
 const x=JSON.parse(row.values[2]);
 if(!x||x.version!==1||!['loan','rental'].includes(x.kind)||!validDay(x.start)||!validDay(x.end)||x.start>x.end||
 !x.customer||!clean(x.customer.name,200)||!x.customer.name.trim()||!clean(x.customer.address,1000)||!clean(x.customer.phone,64)||!clean(x.customer.email,320)||
 !Array.isArray(x.items)||!x.items.length||x.items.length>100||!cents(x.depositCents)||!clean(x.notes,2000)||
 !['flat','day'].includes(x.rateMode)||!validDay(x.created)||new Set(x.items.map(i=>i?.equipmentId)).size!==x.items.length||
 x.items.some(i=>!i||!clean(i.equipmentId,200)||!i.equipmentId||!clean(i.name,500)||!i.name||!positiveInt(i.quantity)||!cents(i.priceCents))||
 (x.kind==='rental'&&(!x.customer.address.trim()||!x.customer.phone.trim()||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x.customer.email)))||
 (x.kind==='loan'&&(!x.customer.phone.trim()||x.items.some(i=>i.priceCents!==0))))throw new Error('Mouvement matériel invalide.');
 return {...x,id:row.id,status:row.values[1]};
}
export function loanRecord(id, status, value){
 const row={id,values:[value.customer.name,status,JSON.stringify(value)]};
 readLoan(row);return row;
}
export function loanTotals(loan){
 const days=Math.round((Date.parse(loan.end)-Date.parse(loan.start))/86400000)+1;
 const factor=loan.rateMode==='day'?days:1;
 return {days,totalCents:loan.items.reduce((n,i)=>n+i.quantity*i.priceCents*factor,0),depositCents:loan.depositCents};
}
function itemMatches(record,item){return item.equipmentId===record.id||(record.aliases||[]).includes(item.equipmentId)||(record.id.startsWith('catalog-')&&item.name===record.values[0]);}
function bookedQuantity(record,loan){return loan.items.filter(i=>itemMatches(record,i)).reduce((n,i)=>n+i.quantity,0);}
export function currentEquipment(record,rows,today=localDay()){
 const total=equipmentQuantity(record);
 const loans=rows.map(readLoan);
 const out=loans.filter(l=>l.status==='out').reduce((n,l)=>n+bookedQuantity(record,l),0);
 const reserved=loans.filter(l=>l.status==='reserved'&&l.start<=today&&l.end>=today).reduce((n,l)=>n+bookedQuantity(record,l),0);
 return {total,out,reserved,available:total===null?null:total-out-reserved};
}
export function availableForPeriod(record,rows,start,end,today=localDay(),excludeId=''){
 const total=equipmentQuantity(record);
 if(total===null||!validDay(start)||!validDay(end)||start>end)return null;
 const intervals=[];
 for(const l of rows.map(readLoan)){
  if(l.id===excludeId||!['out','reserved'].includes(l.status))continue;
  const q=bookedQuantity(record,l);
  if(!q)continue;
  const a=l.status==='out'?(l.start<today?l.start:today):l.start;
  const b=l.status==='out'&&l.end<=today?'9999-12-31':l.end;
  if(a<=end&&b>=start)intervals.push({a:a<start?start:a,b:b>end?end:b,q});
 }
 // Only interval starts can increase concurrent use. Avoid iterating every day.
 let peak=0;
 for(const d of [start,...intervals.map(i=>i.a)])peak=Math.max(peak,intervals.filter(i=>i.a<=d&&i.b>=d).reduce((n,i)=>n+i.q,0));
 return total-peak;
}
export function checkLoanAvailability(loan,equipment,rows,today=localDay(),excludeId=''){
 for(const item of loan.items){
  const record=equipment.find(r=>itemMatches(r,item));
  const available=record?availableForPeriod(record,rows,loan.start,loan.end,today,excludeId):null;
  if(available===null||available<item.quantity)throw new Error(item.name+' : '+(available===null?'quantité à vérifier':Math.max(0,available)+' disponible(s) sur la période')+'.');
 }
}
const euro=n=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(n/100);
export function loanDocument(loan){
 const {days,totalCents,depositCents}=loanTotals(loan);
 const rental=loan.kind==='rental';
 const type=rental?'CONTRAT DE LOCATION MATÉRIEL':'BON DE PRÊT';
 return [type,'Comité des fêtes de Liernais / cfliernais@gmail.com','Référence : '+loan.id,'',
 'Le présent contrat est conclu le '+loan.created+' entre le Comité des fêtes de Liernais (le propriétaire) et '+loan.customer.name+' (le locataire).',
 loan.customer.address,'Téléphone : '+loan.customer.phone,'E-mail : '+loan.customer.email,'',
 'LISTE DU MATÉRIEL',...loan.items.map(i=>i.quantity+' × '+i.name+' — '+euro(i.priceCents)+' / unité — '+euro(i.quantity*i.priceCents*(loan.rateMode==='day'?days:1))),
 '', 'DURÉE DE LA LOCATION','Début : '+loan.start+' à '+(loan.startTime||'à convenir'),'Fin : '+loan.end+' à '+(loan.endTime||'à convenir'),
 '', 'MONTANT DE LA LOCATION','Le locataire s’engage à verser '+euro(totalCents)+' au propriétaire en tant que loyer pour le matériel.',
 'Caution totale convenue : '+euro(depositCents),
 ...(rental?rentalTerms.flatMap(([title,body])=>['',title,body,...(title==='DÉPÔT DE GARANTIE'?rentalCatalog.map(i=>i.name+' : '+euro(i.depositCents)):[])]):[]),
 '',loan.notes?'Observations complémentaires : '+loan.notes:'',
 'En foi de quoi, les parties signent le présent contrat à la date indiquée ci-dessus.',
 '', 'Le propriétaire — Comité des fêtes de Liernais','Nom et fonction du représentant : __________________','Signature : __________________',
 '', 'Le locataire — '+loan.customer.name,'Fonction (le cas échéant) : __________________','Signature : __________________'].join('\n');
}
