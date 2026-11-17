// Suggestions are deliberately not purchase orders or automatic stock movements.
const RULES=[
 {match:/écocups|ecocups|eco cups/i,item:"Écocups",quantity:"À vérifier"},
 {match:/\bgaz\b/i,item:"Bouteilles de gaz",quantity:"À vérifier"},
 {match:/\bpain\b/i,item:"Pain",quantity:"À préciser"},
 {match:/charbon/i,item:"Charbon",quantity:"À préciser"},
 {match:/\b(frites|huile)\b/i,item:"Frites et huile",quantity:"À préciser"},
 {match:/\b(fûts?|futs?|buvette)\b/i,item:"Boissons pour la buvette",quantity:"À préciser"},
 {match:/sacs panini/i,item:"Sacs panini",quantity:"À préciser"},
 {match:/\blots\b/i,item:"Lots",quantity:"À préciser"},
 {match:/affiches/i,item:"Affiches",quantity:"À préciser"}
];
export function suggestEventPurchases(eventId,tasks,shopping){
 if(typeof eventId!=="string"||!eventId||!Array.isArray(tasks)||!Array.isArray(shopping))throw new TypeError("Invalid event purchases");
 const existing=new Set(shopping.filter(x=>x?.eventId===eventId).map(x=>String(x.values?.[0]||"").trim().toLocaleLowerCase("fr")));
 const proposed=new Map();
 for(const task of tasks){
  if(task?.eventId!==eventId)continue;
  const title=String(task.values?.[0]||"");
  for(const rule of RULES){
   if(rule.match.test(title)&&!existing.has(rule.item.toLocaleLowerCase("fr")))proposed.set(rule.item,{values:[rule.item,rule.quantity,"À prévoir"],eventId});
  }
 }
 return [...proposed.values()];
}
