import {validateDemoData} from './demoBackup.js';

export const PURCHASED='Acheté';
export const TRANSFERRED='Transféré au stock';
export const productKey=name=>String(name??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').trim().replace(/\s+/g,' ');
export const isTransferred=row=>String(row?.values?.[2]??'').startsWith(TRANSFERRED);
export const isPurchased=row=>row?.values?.[2]===PURCHASED;
export const inPurchaseScope=(row,scope='')=>(row.eventId||'')===scope;
export function quantity(value){
 const raw=String(value??'').trim().replace(',','.');
 if(!/^\d+(?:\.\d{1,3})?$/.test(raw))return null;
 const n=Number(raw);
 return Number.isFinite(n)&&n>=0&&n<=1e9?n:null;
}
export const quantityText=n=>String(Math.round(n*1000)/1000);
export function purchaseCatalog(data,scope=''){
 const active=(data.shopping||[]).filter(r=>inPurchaseScope(r,scope)&&!isTransferred(r));
 const used=new Set(),keys=new Set(),products=[];
 // Stable catalog keys and order keep focus when the first digit creates a row.
 for(const stock of data.stock||[]){
  if(stock.eventId)continue;
  const key=productKey(stock.values[0]);
  if(!key||keys.has(key))continue;
  keys.add(key);
  const row=active.find(r=>!used.has(r.id)&&productKey(r.values[0])===key)||null;
  if(row)used.add(row.id);
  products.push({key:'catalog:'+stock.id,name:row?.values[0]||stock.values[0],row});
 }
 for(const row of active)if(!used.has(row.id))products.push({key:row.id,name:row.values[0],row});
 return products;
}
export function setPurchaseQuantity(data,{scope='',rowId,name,value,newId}){
 const raw=String(value);
 if(!/^\d{0,10}(?:[.,]\d{0,3})?$/.test(raw)||raw.length>14)throw Error('Saisis une quantité numérique (3 décimales maximum).');
 const rows=data.shopping||[];
 if(rowId){
  const row=rows.find(r=>r.id===rowId&&inPurchaseScope(r,scope)&&!isTransferred(r));
  if(!row)throw Error('Cette ligne a changé. Actualise la liste.');
  return {...data,shopping:rows.map(r=>r.id===rowId?{...r,values:[r.values[0],raw,isPurchased(r)?'À acheter':r.values[2]]}:r)};
 }
 if(!raw)return data;
 if(rows.some(r=>inPurchaseScope(r,scope)&&!isTransferred(r)&&productKey(r.values[0])===productKey(name)))throw Error('Cet article est déjà dans la liste.');
 return {...data,shopping:[...rows,{id:newId(),values:[name,raw,'À acheter'],...(scope?{eventId:scope}:{})}]};
}
export function setPurchaseChecked(data,{scope='',rowId,checked}){
 const row=(data.shopping||[]).find(r=>r.id===rowId&&inPurchaseScope(r,scope)&&!isTransferred(r));
 if(!row)throw Error('Cette ligne a changé.');
 if(checked&&!(quantity(row.values[1])>0))throw Error('Indique une quantité positive avant de cocher.');
 return {...data,shopping:data.shopping.map(r=>r.id===rowId?{...r,values:[r.values[0],r.values[1],checked?PURCHASED:'À acheter']}:r)};
}
export function removePurchase(data,{scope='',rowId}){
 const row=(data.shopping||[]).find(r=>r.id===rowId&&inPurchaseScope(r,scope)&&!isTransferred(r));
 if(!row)throw Error('Cette ligne a changé.');
 return {...data,shopping:data.shopping.filter(r=>r.id!==rowId)};
}
export function purchaseFingerprint(data,scope=''){
 return JSON.stringify([(data.stock||[]),(data.shopping||[]).filter(r=>inPurchaseScope(r,scope))]);
}
export function preparePurchaseTransfer(data,scope=''){
 const checked=(data.shopping||[]).filter(r=>inPurchaseScope(r,scope)&&isPurchased(r));
 if(!checked.length)throw Error('Coche les articles achetés avant de transférer.');
 return checked.map(row=>{
  const key=productKey(row.values[0]);
  const matches=(data.stock||[]).filter(r=>!r.eventId&&productKey(r.values[0])===key);
  if(matches.length>1)throw Error('Doublon dans le stock : '+row.values[0]+'. Corrige les fiches avant le transfert.');
  const target=matches[0];
  return {id:row.id,key,name:row.values[0],actual:row.values[1],stockId:target?.id||'',current:target?quantity(target.values[1]):0};
 });
}
export function transferPurchases(data,{scope='',actual={},opening={},fingerprint,newId,date}){
 if(fingerprint!==purchaseFingerprint(data,scope))throw Error('Le stock ou la liste a changé. Recommence la vérification.');
 const lines=preparePurchaseTransfer(data,scope);
 const groups=new Map();
 for(const line of lines){
  const n=quantity(actual[line.id]);
  if(n===null||n<=0)throw Error('Quantité réellement achetée invalide : '+line.name+'. Décoche les articles non achetés.');
  let group=groups.get(line.key);
  if(!group){
   const base=line.current===null?quantity(opening[line.key]):line.current;
   if(base===null)throw Error('Renseigne le stock actuel de '+line.name+' (0 si aucun).');
   group={...line,base,added:0};groups.set(line.key,group);
  }
  group.added+=n;
  if(group.base+group.added>1e9)throw Error('Quantité trop grande : '+line.name);
 }
 let stock=[...(data.stock||[])];
 for(const g of groups.values()){
  const total=quantityText(g.base+g.added);
  if(g.stockId)stock=stock.map(r=>r.id===g.stockId?{...r,values:[r.values[0],total,r.values[2]]}:r);
  else stock.push({id:newId(),values:[g.name,total,'']});
 }
 const ids=new Set(lines.map(l=>l.id));
 const shopping=data.shopping.map(r=>ids.has(r.id)?{...r,values:[r.values[0],quantityText(quantity(actual[r.id])),TRANSFERRED+' · '+date]}:r);
 return validateDemoData({...data,stock,shopping});
}
