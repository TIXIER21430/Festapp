# FEST'APP — recette de restauration isolée (aucune exécution automatique)

**Statut : procédure à valider, projet TEST exclusivement.** Ne jamais utiliser le projet TIXAPP ni un projet FEST'APP contenant des données réelles. Le SQL préparatoire `docs/sql/festapp_mvp_test_only.sql` n'a pas été appliqué ici.

## Conditions préalables

- Deux projets Supabase de test indépendants : TEST-SOURCE et TEST-RESTAURATION, sans données personnelles réelles.
- Trois comptes fictifs distincts (admin, editor, reader), et un utilisateur non membre.
- Un inventaire fictif, deux manifestations fictives, deux tâches, trois contacts fictifs (bénévole, exposant, groupe).
- Stockage sécurisé et chiffré des exports de test ; ne jamais committer les sauvegardes, mots de passe, clés de service ni coordonnées.
- Relecture de la migration par un responsable technique avant application **sur TEST uniquement**. Les instructions ci-dessous ne déclenchent aucune migration.

## Scénario de sauvegarde et restauration

1. Sur TEST-SOURCE, relever les identifiants UUID et nombres de lignes par table, puis exporter **les données de test** avec un outil PostgreSQL approprié. Inclure les dépendances de clés étrangères et les comptes de test ou prévoir leur correspondance explicite sur le projet cible.
2. Calculer une empreinte SHA-256 du fichier de sauvegarde et conserver séparément le manifeste (date, environnement, schéma, tables, nombres de lignes, empreinte). Ne pas enregistrer de secrets dans le manifeste.
3. Vérifier l'intégrité du fichier exporté et sa capacité à être relu **avant** toute opération sur TEST-RESTAURATION.
4. Préparer sur TEST-RESTAURATION un schéma compatible validé ; importer uniquement les données fictives. L'import doit être refusé si la cible n'est pas explicitement marquée comme environnement de test vierge.
5. Comparer les nombres de lignes, UUID, relations tâches→manifestations et mouvements→inventaire ; vérifier les sommes des mouvements et les soldes, sans supposer que le nombre de lignes suffit.
6. Rejouer les tests d'accès : anonyme refusé ; reader sans accès aux coordonnées ; editor autorisé ; aucun membre ne peut s'attribuer un rôle ; écritures écocups directes refusées.
7. Tester deux sorties simultanées épuisant le même inventaire : une seule doit aboutir ; réessayer avec la même clé d'idempotence et vérifier qu'aucun mouvement supplémentaire n'apparaît.
8. Tester sur téléphone : reconnexion, rafraîchissement, lecture des données partagées, exports CSV et message d'erreur réseau. Vérifier qu'aucune donnée d'essai n'apparaît dans un espace réel.

## Critères de validation

La restauration est considérée **non validée** tant que les deux projets de test, les comptes de rôle et les résultats écrits des scénarios ne sont pas disponibles. Conserver les résultats horodatés, le manifeste SHA-256 et les anomalies dans le dossier de recette, sans inclure de données personnelles. Aucun déploiement ni fusion sur main n'est autorisé par cette procédure.

## Risques à lever avant branchement de l'application

- Les tâches de la démo actuelle sont associées à des libellés libres ; exiger une correspondance manuelle vers les UUID des manifestations et une prévisualisation avant import.
- Ne jamais importer automatiquement les enregistrements `seed-*` de la démonstration.
- Les coordonnées ne doivent jamais être chargées dans une démo publique ou un navigateur non autorisé.
- La migration SQL de préparation n'est pas une preuve de sécurité : les politiques RLS et la fonction écocups doivent être testées réellement dans PostgreSQL sur TEST.
