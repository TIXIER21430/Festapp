// Starter cards only: the committee's original recipe measurements are unknown.
// Never insert guessed ingredients or mark these records as approved.
export const RECIPE_STARTERS = Object.freeze([
  Object.freeze({id:"recette-andouillettes-comite",name:"Andouillettes"}),
  Object.freeze({id:"recette-pate-crepes-comite",name:"Pâte à crêpes"})
]);

export function addMissingRecipeDrafts(existing) {
  if (!Array.isArray(existing)) throw new TypeError("Invalid recipe list");
  const names=new Set(existing.map(row=>String(row?.values?.[0]||"").trim().normalize("NFC").toLocaleLowerCase("fr")));
  const ids=new Set(existing.map(row=>row?.id));
  const additions=RECIPE_STARTERS.filter(starter=>
    !ids.has(starter.id)&&!names.has(starter.name.normalize("NFC").toLocaleLowerCase("fr"))
  ).map(starter=>({
    id:starter.id,
    values:[starter.name,"","BROUILLON — saisir les ingrédients et la préparation depuis la recette originale du comité avant utilisation."]
  }));
  return {recipes:[...existing,...additions],added:additions.length};
}
