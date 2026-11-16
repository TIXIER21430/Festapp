# Précontrôle import écocups — 16 novembre 2026

Document de préparation uniquement : aucune importation, modification de stock ou connexion Supabase.

## Avant un import réel
1. Exporter et conserver une sauvegarde datée de l'inventaire et des mouvements existants.
2. Identifier explicitement l'environnement TEST et vérifier qu'il ne pointe vers aucun projet réel.
3. Comparer le stock initial, chaque mouvement (identifiant unique, date, type, quantité) et le solde calculé.
4. Refuser quantités négatives, décimales, identifiants vides ou dupliqués, mouvements inconnus et solde négatif.
5. Prévisualiser les écarts avant toute écriture; demander une confirmation distincte après revue.
6. Vérifier que l'alerte s'active lorsque le stock est inférieur **ou égal** au seuil configuré.
7. Simuler un second import identique : aucun mouvement ne doit être comptabilisé deux fois.
8. Tester les écritures concurrentes et les droits RLS uniquement dans une base TEST isolée.
9. Vérifier export CSV, restauration sur une seconde base TEST et cohérence du solde après restauration.
10. Conserver les preuves (résultats de tests, horodatage, commit et environnement) sans données personnelles.

## Critères bloquants
- Aucune migration ni restauration sur une base réelle sans validation explicite.
- Ne jamais remplacer silencieusement les données existantes.
- Ne jamais considérer une sauvegarde comme validée sans test de restauration.
- Pas de déploiement ni de fusion sur main pendant cette préparation.
