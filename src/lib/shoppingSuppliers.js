// Shared supplier suggestions, not exclusive purchasing restrictions.
export const SUPPLIERS=['Leclerc','DS Restauration','Cave du Ternin','Adagri','Centrakor','Autre'];
const norm=name=>String(name??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').trim();
export function suggestedSupplier(name){
 const n=norm(name);
 if(/^creme de (cassis|framboise|mure|pamplemousse)\b/.test(n)||/\bget\s?27\b/.test(n))return 'Leclerc';
 if(/\b(papier aluminium|papier cuisson)\b/.test(n))return 'Centrakor';
 if(/\b(anis|girofle|cannelle|muscade|gingembre|mandarines?|oranges?|citrons?|papillotes?|thes?|infusions?)\b/.test(n))return 'Leclerc';
 if(/\b(serviettes?|assiettes?|nappes?|couverts?|gobelets?|ecocups?|essuie[ -]?tout|sopalin|deco(?:ration)?s?|barquettes?|sacs? paninis?|pics? a chamallows)\b/.test(n))return 'Centrakor';
 if(/\b(futs?|tonnelets?)\b/.test(n)||/\b(vins?|champagnes?|cremants?)\b/.test(n)&&!/\b(cubis?|bib|bag.in.box)\b/.test(n))return 'Cave du Ternin';
 if(/\b(huiles?|frites?|andouillettes?|oignons?|cremes?|paninis?)\b/.test(n)||/\bjambon\b.*\b(entier|rotir|braiser)\b/.test(n))return 'DS Restauration';
 if(/\b(coca|orangina|perrier|ice[ -]?tea|oasis|eaux?|petillante|softs?|sodas?|limonades?|jus|sirops?|liqueurs?|bieres?|canettes?|vins?|cubis?|cafes?|chocolats?|chamallows?|pains?|baguettes?|laits?|beurres?|farines?|sucres?|oeufs?|fromages?|jambons?|viandes?|fruits?|legumes?|sauces?|ketchup|mayonnaise|moutarde|sel|poivre|bonbons?)\b/.test(n))return 'Leclerc';
 return 'Autre';
}
export function validSupplier(value){return typeof value==='string'&&value.length<=120&&!/[\r\n\u0000-\u001f]/.test(value)&&(SUPPLIERS.includes(value)||(/^Autre : \S/.test(value)&&value.trim()===value));}
export function supplierFor(row,name){return validSupplier(row?.supplier)?row.supplier:suggestedSupplier(name??row?.values?.[0]);}
export const supplierCategory=value=>value.startsWith('Autre : ')?'Autre':value;
export function assignPurchaseSupplier(data,{scope='',rowId,supplier}){
 if(!validSupplier(supplier))throw Error('Fournisseur invalide.');
 const row=(data.shopping||[]).find(r=>r.id===rowId&&(r.eventId||'')===scope&&!String(r.values[2]).startsWith('Transféré au stock'));
 if(!row)throw Error('Cette ligne a changé.');
 return {...data,shopping:data.shopping.map(r=>r.id===rowId?{...r,supplier}:r)};
}
export function shoppingExportGroups(rows,{supplierFilter='all',includePurchased=false}={}){
 const groups=new Map();
 for(const row of rows){
  const status=String(row.values[2]||'');
  if(status.startsWith('Transféré au stock')||(!includePurchased&&status==='Acheté'))continue;
  const supplier=supplierFor(row);
  if(supplierFilter!=='all'&&supplierCategory(supplier)!==supplierFilter)continue;
  const name=String(row.values[0]||'').replace(/[\r\n]+/g,' ').trim();
  const quantity=String(row.values[1]||'').replace(/[\r\n]+/g,' ').trim();
  if(!name||!quantity||/^0(?:[.,]0+)?$/.test(quantity))continue;
  if(!groups.has(supplier))groups.set(supplier,[]);
  groups.get(supplier).push({name,quantity,status:status==='Acheté'?'Acheté':'À acheter'});
 }
 return [...groups].sort(([a],[b])=>SUPPLIERS.indexOf(supplierCategory(a))-SUPPLIERS.indexOf(supplierCategory(b))||a.localeCompare(b,'fr')).map(([supplier,items])=>({supplier,items}));
}
export function shoppingExportText(groups,eventName){
 return ['COMITÉ DES FÊTES DE LIERNAIS','Liste de courses — '+String(eventName).replace(/[\r\n]+/g,' '),'',...groups.flatMap(g=>[g.supplier.toUpperCase(),...g.items.map(i=> (i.status==='Acheté'?'[x] ':'[ ] ')+i.quantity+' × '+i.name),''])].join('\n').trim();
}
export function shoppingMailto({recipient='',subject,body}){
 const address=recipient.trim();
 if(address&&!/^[A-Za-z0-9.!#$%&'*+/=?^_\x60{|}~-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(address))throw Error('Adresse e-mail invalide.');
 const url='mailto:'+encodeURIComponent(address)+'?subject='+encodeURIComponent(String(subject).replace(/[\r\n]+/g,' '))+'&body='+encodeURIComponent(String(body));
 if(url.length>8000)throw Error('Liste trop longue pour le mail direct. Copie le texte ou télécharge le Word.');
 return url;
}
