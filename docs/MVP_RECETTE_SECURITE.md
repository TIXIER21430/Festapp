# FEST'APP — recette MVP et garde-fous avant données réelles

> Document de préparation uniquement. Ne déclenche ni migration, ni déploiement, ni connexion à une base réelle.

## Critères de sortie (environnement TEST isolé obligatoire)

- [ ] Vérifier que l'URL, l'identifiant de projet et les clés de TEST sont distincts de la production ; utiliser uniquement des comptes et coordonnées fictifs.
- [ ] Exécuter les migrations **additives** sur TEST, vérifier qu'une seconde exécution ne détruit ni ne duplique de données.
- [ ] Manifestations : créer deux événements homonymes sur deux années ; vérifier des identifiants stables, puis créer/cocher une tâche dans un seul événement et contrôler l'isolement.
- [ ] Bénévoles : créer, modifier, rechercher et exporter un contact fictif ; vérifier l'absence de fuite de coordonnées vers une session non autorisée.
- [ ] Exposants et groupes : créer deux fiches de chaque type ; contrôler recherche, modification et export CSV.
- [ ] Écocups : vérifier stock initial, entrée, sortie, retour, seuil d'alerte, doublon de mouvement et refus d'un stock négatif ; lancer deux sorties simultanées pour tester l'atomicité côté serveur.
- [ ] CSV : contrôler UTF-8, accents, séparateurs, guillemets, retours à la ligne et neutralisation des formules commençant par =, +, - ou @.
- [ ] Mobile : tester écran étroit, clavier virtuel, grosses zones tactiles, tableaux défilants et confirmation avant action sensible.
- [ ] Droits : utilisateur non connecté = aucune lecture de coordonnées ; membre = accès selon règles approuvées ; administrateur = opérations autorisées uniquement ; tester aussi les accès directs à l'API.
- [ ] Sauvegarde : exporter les données TEST, vérifier le nombre de lignes et l'intégrité, conserver une copie hors du projet.
- [ ] Restauration : sur une **autre** base TEST vierge, restaurer la sauvegarde ; comparer nombres et identifiants ; tester un fichier invalide et un doublon, sans écraser l'existant.
- [ ] Vérifier les tests automatisés et le build, puis effectuer une recette manuelle sur téléphone.

## Critères de blocage

Ne pas déclarer le MVP multiutilisateur prêt si le projet Supabase TEST indépendant n'est pas confirmé, si les règles RLS ne sont pas testées, si la restauration n'a pas été éprouvée ou si les tests CI sont rouges. Une sauvegarde locale du navigateur n'est pas une persistance durable partagée.

## Journal de recette

| Date | Branche / commit | CI | Environnement TEST confirmé | Résultat / anomalie |
| --- | --- | --- | --- | --- |
| À renseigner | À renseigner | À renseigner | Non confirmé | Recette d'intégration non exécutée |

Aucune donnée réelle du Comité ne doit être introduite dans une démonstration publique ou une base de test.
