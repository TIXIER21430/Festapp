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

// Transcription fidèle des listes du Drive du comité (sans coordonnées privées).
// Les rubriques de préparation sont conservées dans le champ responsable/étape.
export const DRIVE_CHECKLISTS={
 "Marché de Noël":{
  source:"https://docs.google.com/document/d/1Pj5Dc9pBoedVuTPh25tkbi0ROFkRLi2Zg9PC3RnnsZU/edit",
  phases:{
   "Avant":["Réserver groupes","Imprimer Affiches","Distribuer les affiches (Saulieu, Liernais, Arnay, les Settons)","Communiquer FB","Commander fond de caisse","Imprimer Tarifs buvette","Pose banderoles (Croix verte, n6 petit train, n6 montée de vouvres, saulieu carrefour entrée, saulieu face sortie usine, route de vevres)","Commander la buvette (futs, vin) cave du ternin","Commander reste buvettes (soft, sirops, café, etc…) Leclerc","Commander nourriture (frites, huile, etc) DS","Commander / acheter Gaz 4 bouteilles mini","Commander pain","Faire les courses","Commander sacs panini Coco","Tel Père Noel (Jésus)","Commander ecocups","Prévenir Sacem","Récupérer Hotte + costume + clés Josiane"],
   "Veille":["Mettre la boisson au frais","Chercher les sapins","Décoration","Mettre la nourriture au frais","Sortir le barnum buvette + celui du fred + petits si besoin","Chauffage?","Sortir les mange debout","Sortir les cendriers","Mise en place poubelles","Préparer ecocups de chamallows et pic","Préparer la pate à crêpe","Préparer paninis","Préparer vin chaud","Bois: Tom"],
   "Jour J (RDV 9h00)":["Chercher pain","Mettre la buvette en place","Tireuse","faire Café /chocolat","Crêpière","Réchaud vin chaud","Paella","Grill Panini","Friteuse","Afficher tarifs","Enceinte","Banderole CFL + sponsors","Tirer tableau électrique","Mettre braseros","A partir de 10h00 : blanchiment frite + andouillettes","Afficher license 4"],
   "Dimanche":["nettoyage / rangement","Ramener les sapins","Sortir les poubelles"]
  }
 },
 "Saint-Laurent":{
  source:"https://docs.google.com/document/d/1oT0Dr9eioXxP2WO5scFayo50ZVjshHEvOOs8XqWvPM4/edit",
  phases:{
   "Avant":["Réserver DJ","Réserver chapiteau","Gérer les manèges (châteaux gonflable?)","Maquillage (Alisson?)","Trouver une animation samedi soir: Poupoupidou","Trouver traiteur dimanche soir","Trouver animation dimanche soir","Imprimer Affiches","Distribuer les affiches (Saulieu, Liernais, Arnay, les Settons)","Communiquer FB","Demander autorisation bal 5h00","Commander fond de caisse","Appeler pour la remorque frigo : Mr Creuzevaut / Florent Guillomard","Appeler municipalité pour barrières manifestation (écart feu artifice 15 m depuis la haie)","Imprimer Tarifs buvette","Pose banderoles (Croix verte, n6 petit train, n6 montée de vouvres, saulieu carrefour entrée, saulieu face sortie usine, route de vevres)","Commander la buvette (futs, vin) chez ADAGRI","Commander reste buvettes (soft, sirops, café, etc…)","Commander nourriture (frites, huile, repas du soir)","Commander / acheter charbon","Commander / acheter Gaz","Commander pain","Acheter les lots tournoi","Acheter lots Chevaux"],
   "Mardi ou mercredi":["Monter chapiteau","Monter les lumières"],
   "Veille":["Mettre la boisson au frais","Préparer buvette chevaux (remorque Quentin) avec frigo, rallonge, tireuse","Mettre la nourriture au frais","Sortir les barnums","Sortir les mange debout","Sortir les cendriers","Mise en place poubelles","Sortir tables et bancs + mise en place","Nappes + couverts","Sortir bar","Préparer la pate à crêpe","Mettre les barrières en place","Estrade"],
   "Jour J (RDV 8h00)":["Chercher pain","Mettre la buvette en place","Tireuse","Café","Crêpière","Afficher tarifs","Enceinte","Banderole CFL + sponsors","Tirer tableau électrique","Tirer tableau électrique pour les manèges","Mise en place barbecue + table","Mise en place friteuse + table","A partir de 10h00 : blanchiment frite","Mise en place service","Afficher license 4"],
   "Soir (à partir de 19h00)":["Tenir buvette","Préparer repas","Servir repas","Protéger structures gonflable (bache) avant feu"],
   "Dimanche":["Préparer la salle pour le soir","Préparer le tournoi de boules","Imprimer grilles","Sortir les poubelles"],
   "Lundi ou mardi":["Démontage Chapiteau","Dépose / repose affiches st laurent / vide grenier","Rangement / nettoyage matériel","Nettoyage salle et extérieurs"],
   "Dimanche suivant":["Sortir les poubelles si besoin"]
  }
 },
 "Fanfare":{
  source:"https://docs.google.com/document/d/16RbqTzqdEEVPQx0YASJ5QAq2cHjY1uHyp-_hOHvGAP0/edit",
  phases:{
   "Avant":["Réserver FANFARE(S)","Réserver chapiteau","Date montage chapiteau","Réserver exposants restauration","Imprimer Affiches","Imprimer flyers voisinage","Distribuer les affiches (Saulieu, Liernais, Arnay, Censerey, Marcheseuil, Vianges, Manlay, St Agnan, St Brisson, Gouloux, les Settons, Moux, Alligny, Dun, Autun, Anost, Cussy, Menessaire, Lucenay, Chissey, Semur, Pouilly, Avallon, Thoisy, La Motte, La Roche, Pont Royal, Vitteaux, Précy)","Communiquer FB","Demander autorisation buvette","Appeler municipalité pour barrières manifestation","Demander arrêté pour bloquer la place","Gerer les logements, combien, chambres?","Demander forçage éclairage public","Commander fond de caisse","Appeler pour la remorque frigo : Mr Creuzevaut / Florent Guillomard","Prévenir Pompiers","Prévenir Gendarmes","SACEM","Imprimer Tarifs buvette","Acheter des banderoles","Acheter eco cups","Pose banderoles (Croix verte, n6 petit train, n6 montée de vouvres, saulieu carrefour entrée, saulieu face sortie usine, route de vevres)","Commander la buvette (futs, vin) chez ADAGRI + tireuse","Commander Fûts Mandubienne","Commander reste buvettes (soft, sirops, café, etc…)","Commander nourriture (frites, huile, repas des musiciens)","Commander / acheter Gaz","Commander / acheter charbon si barbecue","Commander pain","Playlist musique"],
   "Début de semaine":["Flyers voisinage","Demander les barrières à la Mairie","Monter chapiteau","Préparer: Scotch, rilsans, escabeaux, rallonges, poubelles, rubalise, caisse outils"],
   "Veille":["Mettre la boisson au frais","Préparer apéros","Mettre la nourriture au frais","Préparer la pâte à crêpe","Récupérer les courses si besoin","Récupérer les barrières de manifestation (Mairie)","Charger batteries sono"],
   "Samedi (RDV 8h00)":["Mettre les barrières en place","Installer déviation","Chercher pain","Sortir les barnums","Sortir les mange debout","Sortir les cendriers","Sortir bar","Sortir tables et bancs + mise en place","Monter les lumières","Installer sono","Forçage éclairage public","Mise en place poubelles","Mettre la buvette en place","Tireuse","Café","Crêpière","Afficher tarifs","Banderole CFL","Tirer tableau électrique","Tirer tableaux / rallonge pour les exposants","Mise en place barbecue + table","Mise en place friteuse + table","A partir de 14h00 : blanchiment frite","Mise en place service","Installer musiciens","Payer musiciens (chéquier)","Début 18h00","Fin 2H00 idéalement"],
   "Dimanche":["Sortir les poubelles","Finir de ranger / nettoyer (friteuse, tireuse….)","Récupérer baches"],
   "Dimanche suivant":["Sortir les poubelles si besoin"],
   "Journée démontage chapiteau":["Démontage chapiteau (date à préciser)"]
  }
 }
};
export function suggestDriveChecklistTasks(eventName,eventId,existing=[]){
 if(typeof eventId!=="string"||!eventId.trim()||!Array.isArray(existing))throw new TypeError("Invalid event");
 const template=DRIVE_CHECKLISTS[eventName];
 if(!template)return [];
 const present=new Set(existing.filter(r=>r?.eventId===eventId).map(r=>String(r.values?.[0]||"").trim().toLocaleLowerCase("fr")));
 return Object.entries(template.phases).flatMap(([phase,tasks])=>tasks.filter(name=>!present.has(name.trim().toLocaleLowerCase("fr"))).map(name=>({values:[name,"",""],phase,eventId,done:false})));
}
