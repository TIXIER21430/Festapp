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

// Private committee templates are fetched only after membership authorization.
export const DRIVE_CHECKLISTS=Object.create(null);
export function setDriveChecklistTemplates(rows=[]){
 for(const key of Object.keys(DRIVE_CHECKLISTS))delete DRIVE_CHECKLISTS[key];
 for(const row of rows){
  if(typeof row?.event_name==='string'&&row.template?.phases&&typeof row.template.phases==='object')
   DRIVE_CHECKLISTS[row.event_name]=row.template;
 }
}
export async function loadPrivateDriveChecklists(client,spaceId){
 const {data,error}=await client.from('festapp_checklist_templates').select('event_name,template').eq('space_id',spaceId);
 if(error)throw new Error('Impossible de charger les listes privées du comité.');
 setDriveChecklistTemplates(data||[]);
}
export function suggestDriveChecklistTasks(eventName,eventId,existing=[]){
 if(typeof eventId!=="string"||!eventId.trim()||!Array.isArray(existing))throw new TypeError("Invalid event");
 const template=DRIVE_CHECKLISTS[eventName];
 if(!template)return [];
 const present=new Set(existing.filter(r=>r?.eventId===eventId).map(r=>String(r.values?.[0]||"").trim().toLocaleLowerCase("fr")));
 return Object.entries(template.phases).flatMap(([phase,tasks])=>tasks.filter(name=>!present.has(name.trim().toLocaleLowerCase("fr"))).map(name=>({values:[name,"",""],phase,eventId,done:false})));
}
