# FEST’APP — point de livraison de la démo du 18 novembre 2026

## Parcours présentables sur téléphone

- Accueil : dix grandes cases colorées pour toutes les rubriques, sans navigation cachée.
- Tableau de bord par manifestation : tâches restantes, achats, affectations et fiches de stock ; accès direct aux rubriques et à la préparation.
- Préparation : check-lists du comité déjà retranscrites depuis Drive pour Fanfare, Saint-Laurent et Marché de Noël ; contrôle des tâches et suggestions d’achats sans opération automatique.
- Bénévoles : annuaire, affectations, besoins par poste et impression du planning.
- Recettes : calcul de quantités pour une recette complétée ; création explicite des brouillons « Andouillettes » et « Pâte à crêpes » sans quantité inventée.
- Écocups, stock, exports CSV et sauvegarde/restauration JSON locale sécurisée.
- Caisse tactile : **démo uniquement**, aucun paiement SumUp ni vente réelle enregistrée.
- Communication : brouillons de publications Facebook préparés à partir des informations de la manifestation, modifiables et copiables. Ce service local **n'est pas une IA connectée** et ne publie rien.
- Matériel : inventaire local et indication de prêt ou emplacement ; archives et mémoire d'une manifestation.
- Photos : originaux JPEG/PNG/WebP/GIF/HEIC conservés sans modification dans le stockage local du navigateur pour les rubriques Recettes, Communication et Archives. Chaque original est téléchargeable ; **les photos ne sont pas incluses dans le JSON de sauvegarde** et ne sont ni synchronisées ni traitées par IA.

## Vérification de la branche

- `npm test` : 386 tests passent après ajout de Communication, Matériel, Archives et galerie de photos.
- `npm run build` : compilation Vite réussie (avertissement non bloquant sur la taille d’un bundle JS).
- `main` : ne pas fusionner sans validation du comité.

## Ce qui empêche encore la V1 partagée réelle

La démonstration enregistre toujours les fiches sur chaque appareil. La connexion Supabase est en **lecture seule**. Au contrôle du 18 novembre, l’espace du comité compte **zéro membre autorisé**. Il n’y a donc pas de test possible du parcours multiutilisateur connecté et aucune écriture distante ne doit être présentée comme fonctionnelle.

Avant la mise en service : créer un environnement de test Supabase isolé, inviter les comptes individuels explicitement validés, vérifier la RLS avec plusieurs comptes, tester la révision atomique et les conflits, puis réaliser un essai de sauvegarde/restauration avec données fictives. **Aucune modification de la base réelle n’est autorisée par ce document.**

## Scénario de démonstration de cinq minutes

1. Ouvrir FEST’APP sur téléphone : voir les dix cases pastel.
2. Dans « Ma manifestation », sélectionner « Marché de Noël », puis toucher « Préparer ».
3. Ajouter la check-list de préparation et cocher une tâche dans « À faire ».
4. Ouvrir « Bénévoles » et enregistrer une affectation avec un créneau valide.
5. Ouvrir « Recettes », créer les deux brouillons puis renseigner une vraie recette pour tester le calculateur.
6. Télécharger une sauvegarde JSON avant de quitter l’appareil.

Ne pas utiliser la démo pour les encaissements, le stock réel ou les données personnelles du comité avant validation.
