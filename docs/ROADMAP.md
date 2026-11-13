# FEST'APP — Feuille de route fonctionnelle et design

Validée le 13 novembre 2026 pour le Comité des fêtes de Liernais. Cette feuille de route définit les priorités **sans confondre prototype et production**. TIXAPP reste totalement séparée.

## Design validé

- Inspiré des maquettes **2 et 3** : interface claire, grosses cartes colorées facilement cliquables sur téléphone, bandeau festif, icônes lisibles, accès rapides.
- **Grande photo de la prochaine manifestation** sur l'accueil lorsque les médias seront stockés et autorisés. En attendant, prévoir une illustration sans exposer de photos personnelles.
- Grille de cartes : rose manifestations, bleu bénévoles/planning, vert écocups/matériel, jaune finances, violet tâches/communication.
- Responsive, accessibilité (contrastes, clavier, taille des cibles), aucun chiffre fictif présenté comme donnée réelle.

## Priorités dans l'ordre

### 1. Communication, photos et IA
- **Lot 1 — prototype** : brouillons de publication selon événement, ton et objectif ; correction manuelle, copier texte et ouvrir la Page Facebook. Photos sélectionnées uniquement pour aperçu local, pas d'upload ni de conservation dans cette phase.
- **Lot 2** : bibliothèque de photos partagée, albums par manifestation, gestion de consentements, droits et durée de conservation, alertes pour photos de mineurs ; interface de validation par le bureau.
- **Lot 3** : rédaction assistée par une vraie API IA avec clé conservée côté serveur et quotas/coûts contrôlés ; génération de légendes et variantes.
- **Lot 4** : publication Facebook via API Meta uniquement après validation humaine, autorisations de la Page et contrôle des droits ; alternative copier/ouvrir Facebook conservée.

### 2. Fiches manifestations et check-lists
- Fiche événement avec date, lieu, statuts, responsables, documents, budget, stocks, bénévoles et compte rendu.
- Modèles de check-lists réutilisables, assignation, échéances, case à cocher et taux de préparation. Conserver les listes des années précédentes.

### 3. Recettes IA et calcul des quantités
- Conserver la **photo originale** de recette et obtenir une transcription éditable (OCR/IA, revue obligatoire).
- Quantités structurées et unités cohérentes pour ajuster selon le nombre de convives ; arrondis intelligents, conversions et liste de courses.
- Aucune recette manuscrite supprimée après conversion ; traçabilité des corrections.

### 4. Matériel et bénévoles
- Inventaire dépôt, matériel par événement, prêts/retours, états, photos et seuils, incluant écocups.
- Inscription des bénévoles sans compte via formulaire/QR code à accès limité, validation par un membre du bureau, plannings et notifications consenties.
- Annuaire catégorisé bénévoles/exposants/groupes, gestion des consentements et exports autorisés.

### 5. Archives et assistant IA
- Indexer documents, bilans, comptes rendus, historiques, photos autorisées et données d'anciennes manifestations.
- Recherche classique disponible avant l'assistant IA ; réponses sourcées, aucune invention de quantité ou bilan.
- Droits d'accès et restrictions par fichier appliqués à la recherche.

## Prérequis transversaux bloquants avant un usage réel

1. Projet Supabase FEST'APP propre à l'association, indépendant de TIXAPP, RLS vérifiée avec rôles membres/bénévoles.
2. Stockage sécurisé, sauvegardes automatisées, restauration testée et migrations compatibles.
3. Revue et import contrôlé des fichiers Drive du comité ; consentement et minimisation des coordonnées/photos ; ne pas injecter de fichiers réels dans la démo publique.
4. Tests mobiles et navigateur (interactions, liens, export, claviers, tailles de cartes), tests SQL et protections de données.
5. Séparer la **démo publique** (données factices/locales uniquement) de l'application réelle (authentifiée, partagée). Aucune dépense IA ni service externe activé sans validation.

## Conditions de livraison

- Chaque lot : branche et PR en brouillon, tests de compilation, revue avant fusion.
- Pas de fusion automatique sur `main` ni déploiement de données réelles.
- Le module communication en première itération produit des **textes modèles locaux**, pas des textes générés par IA, et **ne publie rien sur Facebook automatiquement**.
