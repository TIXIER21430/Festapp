# FEST'APP — critères de validation du MVP (sans déploiement)

Document de recette pour la branche de préparation. **Aucune étape ci-dessous n'autorise à modifier une base réelle.** Les scénarios doivent être exécutés sur une installation TEST indépendante avec des personnes et coordonnées fictives.

## Parcours utilisateur à valider sur téléphone

| Module | Scénario minimal | Critère d'acceptation |
| --- | --- | --- |
| Manifestations | Créer une manifestation, la modifier, fermer et rouvrir la session | Les informations restent identiques et ne se mélangent pas avec celles d'une autre manifestation |
| Tâches | Ajouter, attribuer, cocher et décocher une tâche | L'état et le lien vers la manifestation survivent à une reconnexion |
| Bénévoles | Créer et corriger un contact fictif avec téléphone et email | Les coordonnées sont retrouvées après reconnexion, sans duplication |
| Exposants et groupes | Ajouter deux contacts de catégories différentes | Les catégories restent distinctes dans la recherche et les exports |
| Écocups | Régler un seuil, enregistrer une entrée et une sortie | Solde cohérent, aucun stock négatif, alerte affichée au seuil prévu |
| CSV | Exporter les contacts, tâches et mouvements | Fichiers lisibles avec en-têtes, encodage UTF-8, caractères accentués et colonnes attendues |
| Mobile | Effectuer les parcours ci-dessus sur écran étroit | Boutons accessibles sans zoom ni défilement horizontal bloquant |

## Sécurité et durabilité : conditions bloquantes avant mise en service

1. Identifier **par écrit** le projet Supabase TEST distinct de toute base de production ; vérifier l'URL et l'identifiant avant chaque opération.
2. Exécuter les migrations **additives uniquement** en TEST ; contrôler les tables existantes, clés étrangères, contraintes, politiques RLS et permissions avec un compte membre et un compte non autorisé.
3. Tester deux sessions utilisateurs : les modifications autorisées sont visibles après reconnexion ; les accès non autorisés échouent, y compris en appel direct à l'API.
4. Produire une sauvegarde TEST horodatée ; restaurer sur **une seconde base TEST vide et isolée** ; comparer les comptes de lignes et les soldes écocups. Ne jamais restaurer sur une base réelle.
5. Vérifier les cas limites : tâche orpheline, doublon de contact, mouvement écocup simultané, seuil atteint, export vide, caractères spéciaux et absence de réseau.
6. Exiger un résultat vert des tests et de la compilation sur le SHA exact proposé à la revue ; documenter les écarts et ne pas déclarer la persistance partagée validée avant une recette effective.

## Fiche de preuve à remplir lors de la recette

- Date, testeur et appareil : **non renseignés**
- Projet TEST (référence non secrète) : **non confirmé**
- Commit GitHub testé : **à renseigner**
- Résultats par parcours : **non exécutés**
- Sauvegarde / restauration TEST : **non exécutées**
- Validation des droits : **non exécutée**
- Décision de mise en service : **BLOQUÉE** tant que les conditions ci-dessus ne sont pas satisfaites.

Ce document ne contient aucune donnée personnelle ni identifiant secret. Il complète les procédures de sauvegarde existantes sans les remplacer.
