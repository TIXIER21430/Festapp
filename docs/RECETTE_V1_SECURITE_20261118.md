# Recette de sécurité V1 FEST'APP — protocole sans données réelles

Document de préparation, non une preuve de validation. Ne pas exécuter sur le projet Supabase réel.

## Préconditions
- Branche de travail uniquement ; PR #19 reste en brouillon, sans fusion ni déploiement.
- Projet TEST exclusivement : `ddpaxzdwxqwypcumjvvn` ; projet réel `pomssbugayytzmmgvflg` interdit pour cette recette.
- Deux comptes TEST fictifs distincts, un `admin/editor` et un `viewer`, créés et autorisés explicitement avant les essais.
- Deux navigateurs ou appareils ; aucun nom, téléphone, e-mail, photo ou recette réelle.
- Export ZIP/JSON local horodaté avant tout essai ; conserver une copie hors navigateur. Vérifier qu'un fichier de sauvegarde est lisible.

## Scénarios de recette (à cocher seulement après exécution)
- [ ] Sans configuration TEST, connexion refusée sans repli vers production.
- [ ] Compte inconnu : aucune lecture ni écriture ; viewer : lecture seule, toutes les mutations refusées.
- [ ] Editor : création d'une manifestation fictive et de tâches, rafraîchissement, déconnexion/reconnexion et persistance vérifiée.
- [ ] Coordonnées fictives bénévoles, exposants et groupes : export CSV correct, caractères accentués et valeurs commençant par `=`, `+`, `-`, `@` neutralisés à l'ouverture dans un tableur.
- [ ] Écocups : seuil paramétrable, alerte au seuil, mouvement doublon refusé, sortie supérieure au stock refusée, concurrence de deux appareils vérifiée.
- [ ] Appareil A modifie une fiche ; appareil B voit la mise à jour ; éditions simultanées provoquent un conflit visible sans écrasement silencieux.
- [ ] Import d'une sauvegarde valide dans un espace de test vide après prévisualisation et confirmation ; comparaison du nombre de fiches et des valeurs exportées.
- [ ] Sauvegarde altérée ou format inconnu : restauration refusée sans toucher aux données existantes.
- [ ] Mobile : boutons et formulaires utilisables à 320 px et 390 px, navigation clavier, aucun débordement horizontal.
- [ ] Tests `npm test` et `npm run build -- --mode test` réussis ; relever SHA, nombre de tests, URL du run et date.

## Critères bloquants
- Toute possibilité d'écriture sur production, fuite de données personnelles, contournement RLS, écrasement concurrent, perte lors de restauration ou absence de sauvegarde vérifiable.
- Aucune ouverture aux 10 membres tant que les essais d'autorisation et de synchronisation sur deux appareils ne sont pas concluants.
- Les photos et paniers de caisse ne sont pas synchronisés par le snapshot TEST : sauvegarde ZIP requise et comportement explicitement signalé.

## Journal de recette
| Date | Commit | Testeur | Appareils | Scénario | Résultat | Preuve | Anomalie |
|---|---|---|---|---|---|---|---|
| À compléter | | | | | Non exécuté | | |

Ce protocole ne modifie aucune base, ne lance aucune migration et n'autorise ni déploiement ni fusion.
