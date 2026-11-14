# FEST'APP — contrat de persistance MVP (préparation, non exécutée)

> **État : conception uniquement.** Aucun SQL de ce document ne doit être appliqué à la base réelle. La démo actuelle utilise `localStorage` (`festapp-demo-v1`), sans synchronisation ni contrôle d'accès. Ne pas y saisir de coordonnées personnelles réelles.

## Entités et identifiants stables

- `events`: UUID, nom, date, lieu, statut, dates de création/modification.
- `tasks`: UUID, `event_id` UUID (clé étrangère, **jamais le nom**), libellé, échéance, statut, `assignee_id` nullable.
- `people`: UUID, nom, prénom, téléphone, courriel, catégorie (`volunteer`, `exhibitor`, `group`), notes; visibilité restreinte.
- `assignments`: UUID, `event_id`, `person_id`, poste, horaire; interdit de dupliquer le même créneau.
- `ecocup_inventory`: UUID, modèle, seuil d'alerte, quantité initiale, version.
- `ecocup_movements`: UUID, `inventory_id`, `event_id` nullable, quantité strictement positive, type (`in`/`out`/`adjustment`), clé d'idempotence unique, auteur, horodatage. Les ajustements sont réservés aux responsables.
- `audit_log`: UUID, table, identifiant de fiche, opération, acteur, date, métadonnées non sensibles.

Ne jamais prendre les lignes de démonstration `seed-*` pour des enregistrements réels. Prévoir un import **prévisualisé**, avec correspondance explicite et dédoublonnage, jamais une migration automatique du stockage local.

## Transactions et accès

1. Authentification obligatoire pour toute table partagée; RLS activée avant exposition des tables.
2. Rôles applicatifs distincts : `admin` (bureau), `editor` (personnes autorisées), `reader` (lecture limitée). Les rôles proviennent d'une table d'adhésions administrée côté serveur, **pas** d'une valeur choisie dans le navigateur.
3. Les coordonnées des bénévoles/exposants/groupes sont accessibles uniquement aux membres autorisés; jamais dans une démo publique ni dans un export accessible anonymement.
4. Les mouvements écocups passent par une fonction PostgreSQL transactionnelle sécurisée, vérifiant rôle, idempotence et solde non négatif sous verrou de ligne. Ne pas faire `SELECT` puis `UPDATE` côté navigateur.
5. Toute suppression opérationnelle doit être remplacée par archivage logique et audit; les sauvegardes restent séparées des données d'essai.

## Migration additive et validation sur projet Supabase de TEST uniquement

- Préparer une migration versionnée ajoutant tables, index, clés étrangères et contraintes, sans `DROP`, `TRUNCATE`, ni réécriture destructive.
- Activer RLS et créer les politiques **avant** tout accès client. Tester accès anonyme refusé, lecteur limité, éditeur autorisé, droits sur coordonnées et interdiction d'élévation de privilèges.
- Simuler 2 sorties simultanées du dernier stock écocups : une seule peut aboutir; tester requêtes répétées avec même clé, seuil d'alerte, historique et retours.
- Tester création d'événement, tâches liées par UUID, changement de nom sans perte de tâches, import/export CSV accentué et restauration sur une base TEST vierge.
- Produire un export daté et chiffré avant recette; vérifier sa restauration **sur un autre projet de test**. Conserver la procédure de retour arrière sans suppression des données réelles.
- Vérifier affichage mobile, navigation clavier, erreurs réseau et absence de perte de saisie. Aucun déploiement ni fusion avant accord explicite.

## Blocage actuel

Aucun projet Supabase FEST'APP de test indépendant et validé n'est confirmé. Il faut son URL et une clé publique de test, avec un compte de test pour chaque rôle, avant de raccorder les écrans. **Ne pas réutiliser la base de TIXAPP.**

## Critère de sortie MVP

Deux membres autorisés retrouvent les mêmes manifestations, tâches, contacts et mouvements après fermeture et reconnexion; les accès non autorisés sont refusés; les exports et une restauration TEST sont vérifiés; les écocups ne passent jamais sous zéro.
