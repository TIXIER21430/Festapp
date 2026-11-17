// Suggested preparation tasks are templates, not claims that anything is done.
export const CHECKLIST_TEMPLATES={
 general:["Définir le budget","Répartir les bénévoles","Vérifier les autorisations nécessaires","Préparer les achats","Contrôler le matériel","Préparer la communication","Vérifier les installations et la sécurité","Faire le bilan après la manifestation"],
 "Marché de Noël":["Contacter les exposants","Organiser les emplacements","Prévoir l’éclairage et l’électricité","Préparer le vin chaud et les consommables"],
 "Vide-grenier":["Préparer le plan des emplacements","Organiser l’accueil des exposants","Prévoir la signalétique et les accès"],
 "Saint-Laurent":["Organiser les équipes des deux journées","Prévoir les commandes alimentaires","Vérifier les installations et les retours matériel"]
};
export function suggestChecklistTasks(eventName,eventId,existing=[]){
 if(typeof eventName!=="string"||!eventName.trim()||typeof eventId!=="string"||!eventId.trim()||!Array.isArray(existing))throw new TypeError("Invalid checklist");
 const names=[...CHECKLIST_TEMPLATES.general,...(CHECKLIST_TEMPLATES[eventName]||[])];
 const normalized=new Set(existing.filter(r=>r?.eventId===eventId&&typeof r.values?.[0]==="string").map(r=>r.values[0].trim().toLocaleLowerCase("fr")));
 return names.filter(name=>!normalized.has(name.toLocaleLowerCase("fr"))).map(name=>({values:[name,"",""],eventId,done:false}));
}
