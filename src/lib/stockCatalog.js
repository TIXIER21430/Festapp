const GROUPS=[["Boissons",["Coca","Orangina","Perrier","Ice Tea","Oasis","Eau petite","Eau grande","Pétillante grande","Bière bouteille","Bière canette","Fûts de bière","Vin","Vin blanc bouteille","Vin rouge bouteille","Vin blanc cubi 3 L","Vin blanc cubi 5 L","Vin rouge cubi 3 L","Vin rouge cubi 5 L","Vin rosé cubi 3 L","Vin rosé cubi 5 L","Vin rouge cubi pour vin chaud 3 L","Vin rouge cubi pour vin chaud 5 L","Get 27","Crème de cassis","Crème de framboise","Crème de mûre","Crème de pamplemousse","Sirops","Sirop de pêche","Sirop de grenadine","Sirop de pamplemousse"]],["Alimentation",["Andouillettes","Jambon en tranches","Jambon entier à braiser","Saucisses hot dog","Frites","Pain","Pains panini","Fromage râpé","Lait","Crème liquide","Beurre 250 g","Œufs","Oignons","Oranges","Citrons","Mandarines","Ketchup","Moutarde","Mayonnaise","Huile de friture","Farine","Sucre bûchettes","Sucre morceaux","Sel","Anis étoilé","Clous de girofle","Cannelle en poudre","Muscade","Gingembre","Café","Café Senseo","Sachets de thé / infusion","Chocolat en poudre","Chamallows","Bonbons","Papillotes"]],["Consommables",["Écocups","Gobelets plastique","Gobelets carton","Barquettes de frites","Assiettes plastique","Assiettes carton","Couverts bois","Couverts plastique","Nappe papier","Serviettes en papier","Papier aluminium","Papier cuisson","Sacs panini","Pics à chamallows"]],["Autres fournitures",["Bouteilles de gaz"]]];
export const STOCK_GROUPS=GROUPS.map(([label])=>label);
export const catalogKey=name=>String(name??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/œ/g,'oe').trim().replace(/\s+/g,' ');
const ranks=new Map(GROUPS.flatMap(([group,names],g)=>names.map((name,i)=>[catalogKey(name),[g,i]])));
export function stockGroup(name){
 const n=catalogKey(name),known=ranks.get(n);
 if(known)return STOCK_GROUPS[known[0]];
 if(/\b(futs?|bieres?|vins?|cubis?|sirops?|liqueurs?|get\s?27|eaux?|sodas?|softs?|jus|limonades?)\b/.test(n)||/^creme de (cassis|framboise|mure|pamplemousse)\b/.test(n))return STOCK_GROUPS[0];
 if(/\b(gobelets?|assiettes?|nappes?|serviettes?|couverts?|barquettes?|sacs?|pics?|ecocups?|papier)\b/.test(n))return STOCK_GROUPS[2];
 if(/\b(gaz|propane|butane|piles?|nettoyants?|javel|materiel)\b/.test(n))return STOCK_GROUPS[3];
 return STOCK_GROUPS[1];
}
export function compareStockNames(a,b){
 const rank=n=>ranks.get(catalogKey(n))||[STOCK_GROUPS.indexOf(stockGroup(n)),/^futs? de biere\b/.test(catalogKey(n))?GROUPS[0][1].indexOf('Fûts de bière'):1000];
 const x=rank(a),y=rank(b);
 return x[0]-y[0]||x[1]-y[1]||String(a).localeCompare(String(b),'fr',{numeric:true});
}
export function stockUnit(name){
 const n=catalogKey(name);
 if(/^futs? de biere\b/.test(n))return 'fûts';
 if(/\bcubi\b/.test(n))return 'cubis';
 if(/\b(bouteille|bouteilles)\b/.test(n)||/^(coca|orangina|perrier|ice tea|oasis|eau |petillante|sirop|creme de |get 27)/.test(n))return 'bouteilles';
 if(n==='lait'||n==='creme liquide'||n==='huile de friture')return 'L';
 if(/^(frites|oignons|farine|chocolat en poudre|fromage rape)$/.test(n))return 'kg';
 if(n==='beurre 250 g')return 'plaquettes';
 return '';
}
export function kegName(brand,capacity){
 const label=String(brand??'').trim().replace(/\s+/g,' ');
 if(!label||label.length>80||/[\r\n\u0000-\u001f]/.test(String(brand)))throw Error('Indique la marque ou le nom de la bière (80 caractères maximum).');
 if(!['20','30'].includes(String(capacity)))throw Error('Choisis un fût de 20 ou 30 L.');
 return 'Fût de bière '+String(capacity)+' L – '+label;
}
export function addKegStock(data,{brand,capacity,newId}){
 const name=kegName(brand,capacity);
 if((data.stock||[]).some(r=>!r.eventId&&catalogKey(r.values[0])===catalogKey(name)))throw Error('Cette bière et cette contenance existent déjà dans le stock.');
 return {...data,stock:[...(data.stock||[]),{id:newId(),values:[name,'','']}]};
}
