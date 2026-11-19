// Historical editions are distinct event IDs. Never attach a legacy balance
// to a year merely because its label resembles the festival name.
export function festivalName(name){
 return String(name||'').trim().replace(/\s+(?:19|20)\d{2}$/,'').trim();
}

export function eventEditionYear(event){
 const label=String(event?.values?.[0]||'');
 const suffix=label.match(/(?:^|\s)((?:19|20)\d{2})$/);
 if(suffix)return Number(suffix[1]);
 const date=String(event?.values?.[1]||'');
 const match=date.match(/(?:^|\D)((?:19|20)\d{2})(?=\D|$)/);
 return match?Number(match[1]):null;
}

export function groupFestivalEditions(events){
 const groups=new Map();
 for(const event of events||[]){
  const name=festivalName(event?.values?.[0]);
  if(!name||!event?.id)continue;
  const key=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
  if(!groups.has(key))groups.set(key,{name,events:[]});
  groups.get(key).events.push(event);
 }
 return [...groups.values()].sort((a,b)=>a.name.localeCompare(b.name,'fr'));
}

export function yearChoices(events,currentYear=new Date().getFullYear()){
 const known=(events||[]).map(eventEditionYear).filter(y=>Number.isInteger(y)&&y>=1900&&y<=2099);
 const min=Math.max(1900,Math.min(2021,...known));
 const max=Math.min(2099,Math.max(currentYear,...known));
 return Array.from({length:max-min+1},(_,i)=>max-i);
}

export function updateEventDetails(events,id,values){
 if(!Array.isArray(events)||!Array.isArray(values)||values.length!==3)throw new TypeError('Fiche manifestation invalide.');
 const cleaned=values.map(value=>String(value??'').trim());
 if(!cleaned[0]||cleaned.some(value=>value.length>200))throw new Error('Indique un nom et limite chaque champ à 200 caractères.');
 const labelYear=cleaned[0].match(/(?:^|\s)((?:19|20)\d{2})$/)?.[1];
 const dateYear=cleaned[1].match(/(?:^|\D)((?:19|20)\d{2})(?=\D|$)/)?.[1];
 if(labelYear&&dateYear&&labelYear!==dateYear)throw new Error('L’année indiquée dans le nom ne correspond pas à la date : corrige les deux champs.');
 if(!events.some(event=>event.id===id))throw new Error('Manifestation introuvable.');
 if(events.some(event=>event.id!==id&&event.values[0].trim().toLocaleLowerCase('fr')===cleaned[0].toLocaleLowerCase('fr')))throw new Error('Une manifestation porte déjà ce nom.');
 return events.map(event=>event.id===id?{...event,values:cleaned}:event);
}

export function createFestivalEdition(events,base,year,id){
 if(!Array.isArray(events)||typeof id!=='string'||!id||events.some(event=>event.id===id))throw new Error('Référence de manifestation invalide.');
 if(!/^(?:19|20)\d{2}$/.test(String(year)))throw new Error('Choisis une année valide, par exemple 2024.');
 const group=groupFestivalEditions(events).find(item=>item.name===base);
 if(!group)throw new Error('Fête inconnue.');
 if(group.events.some(event=>eventEditionYear(event)===Number(year)))throw new Error('Cette fête possède déjà une édition pour cette année.');
 return {id,values:[`${base} ${year}`,'','']};
}

export function parseFinanceCents(value){
 const raw=String(value??'').trim().replace(/[\s\u00a0\u202f€]/g,'');
 if(!/^[+-]?\d+(?:[.,]\d{1,2})?$/.test(raw))return null;
 const cents=Math.round(Number(raw.replace(',','.'))*100);
 return Number.isSafeInteger(cents)?cents:null;
}

export function financeKind(row){
 const label=String(row?.values?.[0]||'');
 const nature=String(row?.values?.[2]||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr');
 if(label.startsWith('Vente caisse · ')||label.startsWith('Annulation caisse · '))return 'revenue';
 if(/recette|vente|don\b|subvention|billetterie|cotisation/.test(nature))return 'revenue';
 if(/depense|achat|frais|facture|location|charge/.test(nature))return 'expense';
 return 'unknown';
}

export function eventYearBalance(events,finance,base,year){
 const group=groupFestivalEditions(events).find(item=>item.name===base);
 const editions=(group?.events||[]).filter(event=>eventEditionYear(event)===Number(year));
 const ids=new Set(editions.map(event=>event.id));
 const rows=(finance||[]).filter(row=>ids.has(row?.eventId));
 let revenueCents=0,expenseCents=0,unclassified=0;
 for(const row of rows){
  const cents=parseFinanceCents(row?.values?.[1]);
  const kind=financeKind(row);
  if(cents===null||kind==='unknown'){unclassified++;continue;}
  if(kind==='revenue')revenueCents+=cents;
  else expenseCents+=cents;
 }
 return {editions,rows,revenueCents,expenseCents,balanceCents:revenueCents-expenseCents,unclassified};
}

export function driveBalanceLinks(catalog,base,year){
 const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const name=normalize(base);
 const y=String(year);
 return (catalog?.files||[]).filter(file=>{
  if(!/^https:\/\/(?:drive|docs)\.google\.com\//.test(file?.url||''))return false;
  const context=normalize(`${file.title} ${file.folder}`);
  return context.includes(name)&&context.includes(y)&&/bilan|financ|comptes?|recettes? et depenses?/.test(context);
 }).slice(0,8);
}
