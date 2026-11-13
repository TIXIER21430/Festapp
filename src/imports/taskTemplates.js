// Tâches opérationnelles issues de la checklist Saint-Laurent du Drive du Comité.
// Aucune coordonnée personnelle n'est incluse. Les tâches importées sont des modèles
// à réinitialiser pour chaque nouvelle édition, pas un état d'avancement réel.
export const taskTemplates=[
["Saint-Laurent","Avant","Réserver DJ"],["Saint-Laurent","Avant","Réserver chapiteau"],
["Saint-Laurent","Avant","Organiser les manèges"],["Saint-Laurent","Avant","Trouver les animations du samedi et du dimanche"],
["Saint-Laurent","Avant","Trouver le traiteur du dimanche"],["Saint-Laurent","Avant","Imprimer et distribuer les affiches"],
["Saint-Laurent","Avant","Communiquer sur Facebook"],["Saint-Laurent","Avant","Demander l'autorisation du bal"],
["Saint-Laurent","Avant","Commander le fond de caisse"],["Saint-Laurent","Avant","Réserver une remorque frigorifique"],
["Saint-Laurent","Avant","Demander les barrières à la mairie"],["Saint-Laurent","Avant","Imprimer les tarifs buvette"],
["Saint-Laurent","Avant","Poser les banderoles"],["Saint-Laurent","Avant","Commander les boissons"],
["Saint-Laurent","Avant","Commander la nourriture et le pain"],["Saint-Laurent","Avant","Acheter le charbon et le gaz"],
["Saint-Laurent","Avant","Acheter les lots des tournois"],
["Saint-Laurent","Mardi ou mercredi","Monter le chapiteau"],["Saint-Laurent","Mardi ou mercredi","Monter les lumières"],
["Saint-Laurent","Veille","Mettre boissons et nourriture au frais"],["Saint-Laurent","Veille","Préparer la buvette chevaux"],
["Saint-Laurent","Veille","Installer barnums, mange-debout, cendriers et poubelles"],
["Saint-Laurent","Veille","Installer tables et bancs"],["Saint-Laurent","Veille","Préparer nappes et couverts"],
["Saint-Laurent","Veille","Préparer la pâte à crêpes"],["Saint-Laurent","Veille","Installer barrières et estrade"],
["Saint-Laurent","Jour J","Chercher le pain"],["Saint-Laurent","Jour J","Installer la buvette, la tireuse et le café"],
["Saint-Laurent","Jour J","Installer crêpière et affichage des tarifs"],
["Saint-Laurent","Jour J","Installer les tableaux électriques"],
["Saint-Laurent","Jour J","Installer barbecue et friteuse"],
["Saint-Laurent","Jour J","Préparer le service et afficher la licence"],
["Saint-Laurent","Soir","Tenir la buvette et servir les repas"],
["Saint-Laurent","Soir","Protéger les structures gonflables avant le feu"],
["Saint-Laurent","Dimanche","Préparer la salle et le tournoi de boules"],
["Saint-Laurent","Dimanche","Sortir les poubelles"],
["Saint-Laurent","Après","Démonter le chapiteau"],
["Saint-Laurent","Après","Retirer ou remplacer les affiches"],
["Saint-Laurent","Après","Ranger et nettoyer le matériel et les locaux"],
["Marché de Noël","Préparation","Prévoir les branchements électriques des stands"],
["Marché de Noël","Préparation","Prévoir les sapins de décoration"],
["Marché de Noël","Préparation","Installer le barnum de buvette"],
["Marché de Noël","Préparation","Commander les écocups de Noël"],
["Marché de Noël","Préparation","Effectuer la déclaration SACEM"],
["Marché de Noël","Préparation","Vérifier le stock avant les achats alimentaires"],
["Marché de Noël","Préparation","Préparer les ingrédients pour la pâte à crêpes"]
].map(([event,phase,title],i)=>({id:"template-"+i,event,phase,title,done:false,source:"Drive Comité"}));

// Autres listes de préparation extraites des documents ODT du Drive.
const additionalTaskTemplates={"Fanfare":{"Avant":["Réserver les fanfares et le chapiteau","Réserver les restaurateurs","Imprimer et distribuer affiches et flyers voisinage","Communiquer sur Facebook","Demander autorisation buvette et arrêté de circulation","Organiser hébergement des musiciens","Prévenir pompiers et gendarmes","Effectuer déclaration SACEM","Commander boissons, nourriture, gaz et pain","Commander écocups et fond de caisse"],"Début de semaine":["Prévenir le voisinage","Demander les barrières","Monter le chapiteau","Préparer rallonges, rubalise et outils"],"Veille":["Mettre boissons et nourriture au frais","Préparer la pâte à crêpes","Récupérer les barrières","Charger les batteries sono"],"Samedi":["Installer barrières et déviation","Installer barnums, tables et bancs","Installer lumières et sono","Installer buvette, tireuse, café et crêpière","Installer alimentation électrique des exposants","Installer barbecue et friteuse","Accueillir et payer les musiciens"],"Dimanche":["Sortir les poubelles","Nettoyer friteuse et tireuse","Récupérer les bâches"]},"Carnaval":{"Avant":["Vérifier autorisation buvette","Trouver un spectacle et remplir GUSO","Commander fond de caisse","Imprimer et distribuer flyers écoles","Commander boissons, nourriture, pain et bonbons","Prévoir décoration"],"Veille":["Mettre boissons et nourriture au frais","Préparer pâte à crêpes","Installer buvette et tarifs"],"Jour J":["Chercher pain et préparer sandwiches","Préparer le café","Organiser déambulation et enceinte","Tenir buvette et crêpes","Accueillir le spectacle","Ranger et nettoyer la salle"]},"Pâques":{"Avant":["Imprimer et distribuer flyers écoles","Commander boissons et chocolats","Vérifier stock d'œufs en plastique"],"Veille":["Mettre boissons et nourriture au frais"],"Jour J":["Amener boissons, œufs et chocolats","Cacher les œufs par niveau d'âge","Organiser la chasse aux œufs","Distribuer chocolats et bonbons","Ranger œufs et boissons"]},"Halloween":{"Avant":["Demander autorisation buvette et vérifier SACEM","Commander fond de caisse","Imprimer et distribuer flyers écoles et habitants","Commander boissons et nourriture","Vérifier bonbons et décoration"],"Veille":["Mettre boissons et nourriture au frais","Préparer pâte à crêpes","Installer buvette, tireuse et affichage"],"Jour J":["Chercher pain et préparer sandwiches","Préparer café","Organiser déambulation déguisée","Organiser musique et animations","Tenir buvette et crêpes","Ranger, nettoyer et sortir poubelles"]},"Vide-grenier":{"Avant":["Demander autorisations buvette et voirie","Commander fond de caisse","Réserver remorque frigorifique","Demander barrières à la mairie","Imprimer inscriptions, tarifs et avertissements voitures","Commander boissons, nourriture, frites, gaz et pain"],"Veille":["Mettre boissons et nourriture au frais","Préparer café et pâte à crêpes","Sortir barnums, tables et bancs"],"Jour J":["Installer barrières et déviation","Installer buvette et tarifs","Distribuer fiches d'inscription","Chercher pain et viennoiseries","Installer barbecue et friteuse","Mesurer et encaisser les emplacements"],"Soir":["Retirer barrières et déviation","Ranger barnums et buvette","Organiser repas bénévoles"],"Lundi":["Rendre la remorque frigorifique","Finir rangement et tri"]}};
for(const [event,phases] of Object.entries(additionalTaskTemplates))for(const [phase,titles] of Object.entries(phases))for(const title of titles)taskTemplates.push({id:`drive-${event}-${phase}-${taskTemplates.length}`,event,phase,title,done:false,source:'Drive Comité'});
