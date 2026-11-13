# Passage du prototype local à une base partagée — plan de validation

**Statut : proposition uniquement.** Le SQL de `supabase/migrations/20261113_001_festapp_draft.sql` n'a été appliqué à aucune base. Le stockage `localStorage` existant et les PR #1, #2, #3 restent inchangés. Cette branche part de la PR #3 ; elle ne doit pas être fusionnée séparément dans `main` avant les PR parentes.

## Ce que couvre le brouillon
- Manifestations, tâches liées aux manifestations, annuaire (bénévoles/exposants/groupes/partenaires), mouvements écocups.
- Adhésion `memberships` désactivée par défaut : seuls les comptes du bureau activés manuellement pourront lire/écrire via RLS. Les bénévoles ordinaires n'ont pas de compte.
- Mouvements écocups append-only, clé d'idempotence pour éviter les doubles soumissions. Aucune suppression ou modification via les droits client.
- Aucune clé `service_role` dans l'application mobile/web.

## Bloquants avant connexion à une base
1. Créer **une base de test séparée**, jamais la base réelle, puis vérifier les migrations sur un état vierge et sur un état déjà migré.
2. Définir et tester une fonction transactionnelle RPC de sortie écocups avec verrouillage afin d'empêcher un solde négatif en cas de deux sorties simultanées. Les politiques RLS seules ne suffisent pas.
3. Tester sous plusieurs comptes : anonyme, utilisateur authentifié non membre, membre inactif, membre actif ; confirmer refus des accès non autorisés et absence d'écriture sur `memberships`.
4. Prévoir le consentement aux mailings et une politique de conservation des coordonnées. Tester les exports CSV contre l'injection de formules.
5. Définir les procédures de création/révocation des 10 comptes bureau. Vérifier l'accès à la fonction `festapp.is_active_bureau` et les privilèges sur le schéma exposé.
6. Prévoir export complet JSON/CSV et sauvegarde PostgreSQL vérifiée, puis **tester une restauration sur la base de test**. Ne jamais remplacer des données réelles avec la restauration locale du prototype.
7. Concevoir un import contrôlé des anciennes fiches `festapp-demo-v1` : détection des doublons, identifiants stables, journal d'import, validation humaine. Ne jamais synchroniser automatiquement les données de démonstration.
8. Ajouter des tests automatisés DB/RLS et E2E mobile/desktop. La CI de compilation existante ne valide pas le comportement RLS.

## Stratégie de mise en service
- **Phase 1 :** validation du modèle, RPC et tests sur base de test isolée.
- **Phase 2 :** connexion de l'interface via un adaptateur de stockage, sans modifier les écrans existants ; conserver un indicateur clair « démonstration » / « test » / « production ».
- **Phase 3 :** essai avec quelques membres du bureau, import manuel contrôlé, vérification sauvegarde/restauration.
- **Phase 4 :** uniquement après autorisation expresse, migration et déploiement réel.

## Retour arrière
Tant qu'aucune migration n'est appliquée, supprimer la branche suffit à abandonner la proposition, sans incidence sur les données. Après application sur base de test, restaurer un instantané de cette base **de test** ; éviter de supprimer les tables en production. Toute évolution future devra être additive et accompagnée d'un plan de retour arrière.

## Vérifications GitHub du 13 novembre 2026
- PR #1 : socle de journal écocups, workflow GitHub Actions **success** sur `196987d`.
- PR #2 : interface écocups, sauvegarde/restauration locale ; brouillon, non fusionnée.
- PR #3 : annuaire et mailing en CCI ; workflow de compilation **success** sur `3447ed7`, mais tests navigateurs et sécurité non exécutés.
- Aucun résultat de tests Supabase/RLS disponible ; aucun accès à une base de test demandé ou utilisé.
