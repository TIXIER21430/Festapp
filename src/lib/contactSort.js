// Un annuaire se parcourt par nom, indépendamment de l'ordre de saisie.
export function sortContactsByName(rows){
 return [...rows].sort((left,right)=>String(left.values?.[0]||'').localeCompare(String(right.values?.[0]||''),'fr',{sensitivity:'base'}));
}
