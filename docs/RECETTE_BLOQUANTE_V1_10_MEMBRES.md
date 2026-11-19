# Recette bloquante V1 — 10 membres (environnement TEST uniquement)

État : **non validé**. Cette checklist n'autorise ni déploiement, ni migration sur une base réelle, ni fusion. Exécuter les scénarios sur une base Supabase TEST distincte avec des identités et données fictives.

## Préconditions
- Relever SHA de la branche, PR ouvertes, CI associées et `npm ci && npm test && npm run build`. Conserver les résultats datés ; ne jamais assimiler un test écrit à un test réussi.
- Vérifier les variables d'environnement : URL et clé publique du projet TEST exclusivement. Aucune clé service-role dans le navigateur ou les journaux.
- Créer dix comptes fictifs, dont un administrateur et un membre standard. Documenter les rôles et la politique RLS avant tout essai d'écriture.
- Sauvegarder le jeu TEST initial (données et fichiers), enregistrer son empreinte SHA-256, puis préparer une restauration dans **un autre** espace TEST.

## Scénarios obligatoires
| Domaine | Manipulation | Résultat attendu |
| --- | --- | --- |
| Authentification | Connexion/déconnexion ; rafraîchissement ; expiration ; 11e compte non autorisé | Accès refusé sans fuite de données, session correctement invalidée |
| RLS | Un membre tente de lire/écrire hors de son périmètre via l'API directement | Refus côté serveur, pas seulement masquage dans l'interface |
| Synchronisation | Deux membres modifient la même fiche depuis deux appareils, puis reconnexion après coupure réseau | Conflit visible, aucune écriture silencieusement perdue, pas de doublon |
| Manifestations | Créer deux éditions de même nom sur deux années ; changer de manifestation | Identifiants d'édition stables, tâches et données isolées |
| Caisse | Enregistrer vente, annuler, tenter une seconde annulation, exporter bilan | Vente conservée, contre-écriture unique, bilan exact et propre à l'édition |
| Caisse | Rafraîchir après validation, double clic et perte de réseau pendant validation | Aucune vente en double, statut de synchronisation explicite |
| Annuaire | Saisir accents, apostrophes et coordonnées fictives, modifier depuis un autre appareil | Données persistantes et accessibles aux seuls comptes autorisés |
| Écocups | Mouvement de sortie/retour, stock égal au seuil, tentative de stock négatif | Alerte au seuil inclus, aucun mouvement invalide enregistré |
| CSV | Exporter les champs contenant ;, guillemets, retours ligne et texte commençant par =,+,-,@ | Fichier ouvrable, injection de formule neutralisée, aucun mélange entre éditions |
| Recettes | Ouvrir original, adapter pour 20 puis 50 portions, revenir à l'original | Quantités calculées sans modifier l'original, valeurs sources non inventées |
| Mobile | Parcours accueil → fête → préparation → caisse → bilan sur Android et iOS | Pas de menu inutile, pas de perte de contexte, boutons accessibles au pouce |
| Sauvegarde | Export complet, contrôle empreinte, restauration isolée, comparaison avant/après | Données et relations identiques, erreurs et conflits signalés sans écraser l'original |

## Critères de décision
- **GO TEST pilote** : tous les scénarios ci-dessus exécutés avec preuves, sauvegarde/restauration vérifiées, RLS serveur vérifiées, aucune anomalie bloquante, revue humaine de la PR.
- **NO GO** : stockage seulement local, synchronisation non éprouvée, caisse non idempotente, RLS inconnues, restauration non démontrée, recette originale altérée, CI manquante ou rouge.
- Toute migration doit être **additive**, relue et appliquée d'abord au TEST. Ne jamais lancer une migration automatiquement sur le Supabase réel.
- Le propriétaire doit valider explicitement le passage à de vraies données, la fusion et tout déploiement. Les validations sont indépendantes.

## Journal d'exécution à remplir
Date / SHA / PR / CI / environnement TEST / appareils / scénario / résultat / preuve / anomalie / décision.

À la création de ce document : **aucun scénario d'intégration TEST ni essai sur deux appareils n'est revendiqué comme exécuté**.
