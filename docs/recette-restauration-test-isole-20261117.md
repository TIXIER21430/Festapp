# FEST'APP — répétition de restauration hors production

Statut : protocole non exécuté. Ne contient aucun identifiant, secret ni donnée personnelle. Aucune commande ci-dessous ne doit être lancée contre une base réelle.

## Préconditions obligatoires
- Deux projets Supabase **TEST** indépendants, identifiés par leurs références et contrôlés manuellement avant toute commande ; ni l'un ni l'autre ne doit être celui utilisé par le Comité.
- Jeu de données **fictives** uniquement (noms, téléphones et adresses inventés), comprenant deux éditions d'une même manifestation, des tâches liées par UUID, bénévoles, exposants, groupes et un inventaire écocups.
- Migrations additives revues, sauvegarde chiffrée stockée hors dépôt Git, accès restreint et durée de conservation définie.
- Aucune clé `service_role`, chaîne de connexion, sauvegarde brute ni donnée de contact dans les commits, logs CI ou captures.

## Scénario de recette
1. Vérifier explicitement les références TEST source et destination, puis relever SHA Git, version de schéma, horodatage et nombres de lignes par table.
2. Sur TEST source, créer des données fictives et relever les liens `tasks.event_id`, `assignments.person_id`, le stock écocups calculé et le seuil d'alerte.
3. Effectuer une sauvegarde complète de TEST source (schéma, données et politiques), conserver une empreinte SHA-256 du fichier hors Git.
4. Restaurer **uniquement** sur TEST destination vide ; interrompre si une table non vide, un identifiant de projet inattendu ou une migration destructive est détecté.
5. Comparer nombres de lignes, UUID, clés étrangères, soldes écocups, seuils, mouvements et clés d'idempotence ; tout écart est bloquant.
6. Avec deux comptes fictifs, tester les droits RLS : un compte autorisé peut consulter et modifier ses données permises ; un compte non autorisé ne peut ni lire les coordonnées ni modifier le stock via API directe.
7. Sur mobile, se déconnecter et reconnecter après modification d'une tâche et d'un mouvement écocup : vérifier la persistance et l'absence de duplication.
8. Tester les exports CSV (UTF-8, accents, échappement des formules, colonnes), y compris après restauration.
9. Consigner les preuves sans données sensibles : SHA, identifiants TEST non secrets, date, scénarios, résultat, écarts, décision.

## Arrêt immédiat
En cas d'identifiant d'environnement ambigu, d'accès non autorisé, de divergence de stock, de restauration incomplète ou de migration non additive : **ne rien appliquer à la production**, documenter le défaut et reprendre sur un TEST neuf après correction.

## Résultats
- Projet TEST indépendant : non confirmé.
- Sauvegarde/restauration : non exécutées.
- Tests RLS multiutilisateurs : non exécutés.
- Mise en service : non autorisée.
