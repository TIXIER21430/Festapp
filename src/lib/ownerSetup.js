// A private, manual review checklist: review is never inferred from a mere row count.
export const OWNER_REVIEW_KEY='festapp-owner-review-v1';
export const OWNER_MODULES=Object.freeze([
 {key:'events',label:'Manifestations',icon:'🎉',hint:'Contrôler dates, lieux et éditions.'},
 {key:'tasks',label:'Tâches',icon:'✅',hint:'Vérifier les étapes, attribuer les responsables.'},
 {key:'contacts',label:'Annuaire',icon:'👥',hint:'Ajouter les bénévoles et partenaires avec leurs coordonnées.'},
 {key:'shifts',label:'Bénévoles',icon:'🕒',hint:'Affecter les créneaux et les postes.'},
 {key:'shopping',label:'Achats',icon:'🛒',hint:'Confirmer les quantités avant commande.'},
 {key:'stock',label:'Stock',icon:'📦',hint:'Compter le stock réel au local, sans recopier les reliquats historiques.'},
 {key:'ecocups',label:'Écocups',icon:'🥤',hint:'Saisir le stock initial et le seuil d’alerte.'},
 {key:'equipment',label:'Matériel',icon:'🧰',hint:'Distinguer matériel possédé, à acheter ou à louer.'},
 {key:'recipes',label:'Recettes',icon:'🍲',hint:'Joindre les originaux et saisir les ingrédients.'},
 {key:'finance',label:'Finances',icon:'📊',hint:'Vérifier les bilans passés et les écritures en cours.'},
 {key:'posts',label:'Communication',icon:'📣',hint:'Relire les textes avant toute publication.'},
 {key:'feedback',label:'Retours',icon:'📝',hint:'Relire les leçons des dernières fêtes.'},
 {key:'archives',label:'Archives',icon:'🗂️',hint:'Vérifier les liens du Drive et les souvenirs.'}
]);

// A compact change detector, not a security signature. A later edit must
// invalidate a human checkmark, including the ecocup stock configuration.
export function fingerprintOwnerModule(data,key,meta={}){
 const raw=JSON.stringify([Array.isArray(data?.[key])?data[key]:[],key==='ecocups'?meta.ecocups||{}:null]);
 let hash=2166136261;
 for(let i=0;i<raw.length;i++)hash=Math.imul(hash^raw.charCodeAt(i),16777619)>>>0;
 return `${raw.length}:${hash.toString(16).padStart(8,'0')}`;
}

export function parseOwnerReviews(raw){
 if(!raw)return {};
 try{
  const value=JSON.parse(raw);
  if(!value||typeof value!=='object'||Array.isArray(value))return {};
  const valid=new Set(OWNER_MODULES.map(m=>m.key));
  return Object.fromEntries(Object.entries(value).filter(([key,entry])=>valid.has(key)&&entry&&entry.checked===true&&typeof entry.at==='string'&&Number.isFinite(Date.parse(entry.at))).map(([key,entry])=>[key,{checked:true,at:entry.at,fingerprint:typeof entry.fingerprint==='string'&&/^\d+:[0-9a-f]{8}$/.test(entry.fingerprint)?entry.fingerprint:null}]));
 }catch{return {};}
}

export function summarizeOwnerReviews(data,reviews={},meta={}){
 const items=OWNER_MODULES.map(item=>{
  const fingerprint=fingerprintOwnerModule(data,item.key,meta);
  const stored=reviews[item.key];
  return {...item,count:Array.isArray(data?.[item.key])?data[item.key].length:0,fingerprint,checked:stored?.checked===true&&stored.fingerprint===fingerprint,needsRecheck:stored?.checked===true&&stored.fingerprint!==fingerprint,at:stored?.at||null};
 });
 return {items,checked:items.filter(x=>x.checked).length,total:items.length};
}
