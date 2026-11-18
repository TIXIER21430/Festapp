// Suggestions for private data entry. These are NOT validation errors and never
// mark a rubric as reviewed or authorize sharing.
const records=(data,key)=>Array.isArray(data?.[key])?data[key]:[];
const missing=value=>String(value??'').trim()==='';
const countMissing=(items,index)=>items.filter(item=>!Array.isArray(item?.values)||missing(item.values[index])).length;

export function auditOwnerReadiness(data={},meta={}){
 const issues=[];
 const add=(id,key,icon,title,detail,kind='À compléter')=>issues.push({id,key,icon,title,detail,kind});
 const contacts=records(data,'contacts');
 if(!contacts.length)add('contacts-empty','contacts','👥','Annuaire à constituer','Ajoute les personnes et partenaires qui doivent figurer dans la version du comité.');

 const shifts=records(data,'shifts');
 if(!shifts.length)add('shifts-empty','shifts','🕒','Planning bénévoles à préparer','Crée les créneaux et les postes avant d’affecter les bénévoles.');
 else{
  const n=countMissing(shifts,1)+countMissing(shifts,2);
  if(n)add('shifts-incomplete','shifts','🕒','Créneaux ou postes à préciser',`${n} champ(s) « créneau » ou « poste » restent vides dans le planning.`);
 }

 const stock=records(data,'stock');
 if(!stock.length)add('stock-empty','stock','📦','Inventaire réel à faire','Saisis ce qui est physiquement disponible au local ; les anciens reliquats du Drive ne sont pas un comptage.');
 else{
  const n=countMissing(stock,1);
  if(n)add('stock-quantity','stock','📦','Quantités de stock manquantes',`${n} fiche(s) de stock sans quantité : vérifier le stock réel sur place.`);
 }

 const recipes=records(data,'recipes');
 if(!recipes.length)add('recipes-empty','recipes','🍲','Recettes à saisir','Renseigne ingrédients et préparation à partir des documents que tu souhaites conserver.','À envisager');

 const ecocups=records(data,'ecocups');
 const opening=meta?.ecocups?.opening;
 if(missing(opening)&&!ecocups.length)add('ecocups-opening','ecocups','🥤','Écocups : point de départ à saisir','Vérifie le stock initial des gobelets avant le suivi des mouvements.');

 const events=records(data,'events');
 const eventDates=countMissing(events,1);
 if(eventDates)add('events-date','events','📅','Manifestations sans date d’édition',`${eventDates} fiche(s) sans date : certaines sont peut-être des modèles annuels, à dater seulement lorsque l’édition est prévue.`, 'À vérifier');

 const shopping=records(data,'shopping');
 const shoppingQuantities=countMissing(shopping,1);
 if(shoppingQuantities)add('shopping-quantity','shopping','🛒','Achats sans quantité',`${shoppingQuantities} article(s) sans quantité. Les chiffres doivent être confirmés avant commande.`, 'À vérifier');

 const tasks=records(data,'tasks');
 const unassigned=countMissing(tasks,1);
 if(unassigned)add('tasks-owner','tasks','✅','Tâches sans responsable',`${unassigned} tâche(s) non attribuée(s), parfois issues d’anciennes listes : affecte celles de la prochaine fête.`, 'À vérifier');

 return {issues,count:issues.length};
}
