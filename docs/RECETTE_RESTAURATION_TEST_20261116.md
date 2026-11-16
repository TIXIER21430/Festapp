# FEST'APP — recette de sauvegarde et restauration (TEST uniquement)

Statut : **protocole non exécuté**. Aucun accès à la base de production n'est autorisé par ce document. Ne pas appliquer les migrations ni importer de données sans validation préalable.

## Préconditions obligatoires

1. Utiliser un projet Supabase **TEST distinct** du projet réel, avec URL, identifiant de projet, clés et comptes de test propres. Ne jamais copier de données personnelles réelles vers TEST.
2. Vérifier et consigner l'identifiant du projet cible, l'environnement, la branche et le SHA du commit avant chaque opération.
3. Préparer uniquement des jeux fictifs : deux manifestations homonymes d'années différentes, tâches avec identifiants de manifestation, bénévoles, exposants et groupes fictifs, et mouvements d'écocups.
4. Vérifier que la migration est **additive**, sans `DROP`, `TRUNCATE`, `DELETE`, remplacement de table ou désactivation de RLS ; faire relire les privilèges `SECURITY DEFINER`.
5. Vérifier que les accès anonymes et comptes inactifs ne peuvent ni consulter les coordonnées ni écrire dans les tables. Tester séparément les comptes autorisés.

## Scénario de recette sur TEST isolé

- Capturer un inventaire avant essai : tables, schéma, politiques RLS, nombre de lignes par table, horodatage et version de migration. Ne pas enregistrer de secrets dans Git.
- Produire une sauvegarde cohérente TEST incluant schéma et données fictives ; enregistrer emplacement, taille, empreinte SHA-256 et procédure de chiffrement/accès dans un journal privé.
- Restaurer la sauvegarde dans **un troisième environnement jetable**, jamais dans le projet TEST source ni dans la production. Contrôler les versions PostgreSQL/extensions et les erreurs de restauration.
- Comparer avant/après : nombre de manifestations, tâches et contacts par catégorie ; identifiants, relations, coordonnées fictives ; mouvements écocups et solde recalculé ; seuil d'alerte.
- Vérifier qu'un import avec identifiant de contact en double est rejeté sans écrasement et qu'une restauration invalide n'altère pas l'état existant.
- Simuler deux sorties simultanées d'écocups dont le total dépasse le stock ; confirmer qu'une seule peut réussir, qu'aucun solde négatif n'apparaît et qu'une répétition avec la même clé d'idempotence ne double pas le mouvement.
- Contrôler les exports CSV dans un tableur avec accents, séparateurs, cellules vides et cellules commençant par `=`, `+`, `-`, `@` ; vérifier la neutralisation des formules.
- Tester sur smartphone : saisie, navigation, alertes de seuil, téléchargement CSV, coupure réseau, reprise de session et refus d'accès après révocation.

## Critères de sortie

- Journal de recette daté avec commit, projet TEST, jeux fictifs, commandes utilisées, résultats attendus/observés, erreurs, captures et approbation humaine.
- Sauvegarde TEST lisible et restauration vérifiée dans l'environnement jetable, avec contrôles de cohérence et d'accès réussis.
- Aucun secret ni donnée réelle dans le dépôt, aucune migration exécutée sur une base réelle, aucune fusion ou déploiement automatique.

## Blocage actuel

Projet Supabase FEST'APP TEST indépendant et autorisation de recette non confirmés. En attendant, seules les revues statiques, les tests locaux et les modifications GitHub sur branche dédiée sont permises.
