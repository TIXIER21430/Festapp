import {catalogKey,stockUnit,compareStockNames} from './stockCatalog.js';
import {quantity,quantityText,isTransferred,isPurchased,inPurchaseScope} from './purchaseStock.js';
import {supplierFor} from './shoppingSuppliers.js';

const aliases={
 'gaz':'Bouteilles de gaz','oignon':'Oignons','andouillette':'Andouillettes','orange':'Oranges','citron':'Citrons','mandarine':'Mandarines','oeuf':'Œufs','serviettes':'Serviettes en papier','serviette':'Serviettes en papier','coca cola':'Coca','coca-cola':'Coca','chocolat poudre':'Chocolat en poudre','cafe senseo':'Café Senseo','creme':'Crème liquide','jambon tranche':'Jambon en tranches','jambon entier':'Jambon entier à braiser','pain panini':'Pains panini','saucisse hot dog':'Saucisses hot dog','huile':'Huile de friture','biere en bouteille':'Bière bouteille','biere en canette':'Bière canette','get27':'Get 27'
};
const key=name=>catalogKey(name).replace(/(\d)\s*l\b/g,'$1 l').replace(/[–—]/g,'-');
const singular=name=>key(name).split(' ').map(w=>w.length>3&&w.endsWith('s')?w.slice(0,-1):w).join(' ');
const unitPattern='kg|kilos?|kilogrammes?|g|grammes?|l|litres?|cl|centilitres?|ml|millilitres?|bouteilles?|canettes?|cubis?|f[uû]ts?|plaquettes?|pi[eè]ces?|unit[eé]s?|packs?|paquets?|cartons?';
const number='\\d+(?:[.,]\\d{1,3})?';
const prefix=new RegExp('^('+number+')\\s+('+unitPattern+')(?:\\s+d[eu]\\s+|\\s+d[’\\x27]|\\s+)(.+)$','i');
const suffix=new RegExp('^('+number+')(?:\\s*('+unitPattern+'))?$','i');
const unitKey=u=>{
 const n=key(u);
 if(/^(kg|kilo|kilogramme)/.test(n))return 'kg';
 if(/^(g|grammes?)$/.test(n))return 'g';
 if(/^(l|litres?)$/.test(n))return 'l';
 if(/^(cl|centilitres?)$/.test(n))return 'cl';
 if(/^(ml|millilitres?)$/.test(n))return 'ml';
 if(/^(pieces?|unites?)$/.test(n))return 'count';
 return n.replace(/s$/,'');
};
function resolveName(raw,stock){
 const n=key(raw),alias=aliases[n];
 const variants=[n,alias&&key(alias)].filter(Boolean);
 const cubi=n.match(/^(?:cubis?\s+(?:de\s+)?(?:vin\s+)?(blanc|rouge|rose)|vin\s+(blanc|rouge|rose)\s+(?:en\s+)?cubi)\s+([35])\s*l$/);
 if(cubi)variants.push('vin '+(cubi[1]||cubi[2])+' cubi '+cubi[3]+' l');
 const exact=stock.filter(r=>variants.includes(key(r.values[0])));
 if(exact.length>1)throw Error('Plusieurs fiches correspondent : précise le produit.');
 if(exact.length===1)return exact[0];
 const simple=stock.filter(r=>singular(r.values[0])===singular(raw));
 if(simple.length>1)throw Error('Plusieurs fiches correspondent : précise le produit.');
 if(simple.length===1)return simple[0];
 // Never silently choose a size, colour, brand, or material.
 const partial=stock.filter(r=>key(r.values[0]).startsWith(n+' ')||key(r.values[0]).includes(' '+n+' '));
 if(partial.length)throw Error('Précise le produit : '+partial.slice(0,5).map(r=>r.values[0]).join(', ')+'.');
 return null;
}
export function parseMeetingNeed(line,stock=[]){
 let raw=String(line).trim().replace(/^(?:il faut(?: prévoir)?|il nous faut|on a besoin de|nous avons besoin de|prévoir|besoin de|acheter|commander)\s+/i,'').replace(/[.!]$/,'').trim();
 let name='',value='',unit='';
 if(raw.includes(';')){
  const parts=raw.split(';').map(s=>s.trim());
  if(parts.length!==2)throw Error('Écris un produit et une quantité par ligne.');
  name=parts[0];const m=parts[1].match(suffix);
  if(!m)throw Error('Indique une quantité numérique.');value=m[1];unit=m[2]||'';
 }else{
  const first=raw.match(prefix),simple=raw.match(new RegExp('^('+number+')\\s+(.+)$')),last=raw.match(new RegExp('^(.+?)\\s+('+number+')(?:\\s*('+unitPattern+'))?$','i'));
  let fullProduct=null;
  if(first&&simple){try{fullProduct=resolveName(simple[2],stock);}catch(e){throw e;}}
  if(fullProduct){value=simple[1];name=fullProduct.values[0];}
  else if(first){value=first[1];unit=first[2];name=first[3];}
  else if(simple){value=simple[1];name=simple[2];}
  else if(last&&!stock.some(r=>key(r.values[0])===key(raw))){name=last[1];value=last[2];unit=last[3]||'';}
  else throw Error('Indique la quantité, par exemple « 48 Coca » ou « Frites ; 25 ».');
 }
 name=name.trim();const n=quantity(value);
 if(!name||name.length>200||n===null||n<=0)throw Error('Indique un produit et une quantité positive.');
 // Match a full catalog name before interpreting a unit word in the product.
 const target=resolveName(name,stock);
 const canonical=target?.values[0]||name;
 const expected=stockUnit(canonical);
 let needed=n;
 if(unit){
  const u=unitKey(unit),e=unitKey(expected);
  if(u==='g'&&e==='kg')needed=n/1000;
  else if(u==='cl'&&e==='l')needed=n/100;
  else if(u==='ml'&&e==='l')needed=n/1000;
  else if(u==='count'&&!['kg','l'].includes(e)){}
  else if(!e||u!==e)throw Error('Unité à vérifier pour '+canonical+(expected?' (stock en '+expected+')':' : utilise la même unité que le stock, sans la préciser')+'.');
 }
 if(needed<=0||needed>1e9||Math.abs(Number(quantityText(needed))-needed)>1e-9)throw Error('Quantité trop précise (3 décimales maximum).');
 return {name:canonical,key:key(canonical),needed:Number(quantityText(needed)),target,unit:expected};
}
export function planMeetingPurchases(data,eventId,lines){
 const stock=(data.stock||[]).filter(r=>!r.eventId),shopping=(data.shopping||[]).filter(r=>inPurchaseScope(r,eventId)&&!isTransferred(r));
 const needs=new Map(),errors=[],duplicates=[],rows=[],summary=[];
 for(const line of lines){
  try{
   const item=parseMeetingNeed(line,stock);
   const old=needs.get(item.key);
   if(old){
    if(old.needed===item.needed){duplicates.push(line);continue;}
    throw Error('Deux quantités différentes pour '+item.name+'. Indique le besoin total sur une seule ligne.');
   }
   needs.set(item.key,item);
  }catch(e){errors.push(line+' : '+e.message);}
 }
 for(const item of [...needs.values()].sort((a,b)=>compareStockNames(a.name,b.name))){
  const {name,needed,target,unit}=item;
  const available=target?quantity(target.values[1]):0;
  const existing=shopping.filter(r=>key(r.values[0])===item.key);
  if(existing.some(r=>quantity(r.values[1])===null)){errors.push(name+' : une quantité de la liste de courses est à préciser.');continue;}
  const planned=existing.reduce((n,r)=>n+quantity(r.values[1]),0);
  const pending=existing.filter(r=>!isPurchased(r));
  const additional=Math.max(0,Number(quantityText(needed-(available??0)-planned)));
  const supplier=supplierFor(pending[0]||existing[0],name);
  summary.push({name,needed,available,planned,additional,unit,supplier,unknown:!target});
  if(!additional)continue;
  if(pending.length>1){errors.push(name+' : plusieurs lignes de courses existent déjà. Regroupe-les avant validation.');continue;}
  if(pending.length===1){
   const row=pending[0],total=Number(quantityText(quantity(row.values[1])+additional));
   rows.push({category:'shopping',row:{...row,values:[name,quantityText(total),row.values[2]],supplier},replaceId:row.id,label:'Courses · '+name+' : compléter de '+quantityText(additional)+' (total '+quantityText(total)+')'});
  }else rows.push({category:'shopping',row:{id:'preview-purchase-'+rows.length,eventId,values:[name,quantityText(additional),'À acheter'],supplier},label:'Courses · '+name+' : '+quantityText(additional)});
 }
 return {rows,errors,duplicates,summary};
}
