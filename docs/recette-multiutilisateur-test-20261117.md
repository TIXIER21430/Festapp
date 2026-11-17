# FEST'APP — protocole de recette avant ouverture aux bénévoles

Ce document est un **mode opératoire TEST**, pas une autorisation de déployer. Ne pas utiliser de vraies coordonnées dans les essais. Le stockage local du navigateur n'est **pas** une base partagée entre les 10 comptes et peut disparaître si le navigateur est réinitialisé.

## Conditions préalables (bloquantes)
- [ ] Projet Supabase **TEST** distinct, identifié par son URL et son identifiant, sans aucune donnée réelle.
- [ ] Variables d'environnement TEST séparées des variables de production ; aucune clé de service dans le navigateur ou le dépôt.
- [ ] Migration additive relue (pas de DROP, TRUNCATE, DELETE, modification destructive ni remplacement de politique RLS existante).
- [ ] Sauvegarde TEST datée, procédure de restauration écrite et essai de restauration sur un autre environnement TEST.
- [ ] Comptes fictifs avec rôles administrateur, membre du bureau et accès non autorisé.

## Scénarios à exécuter avec données fictives
| Domaine | Manipulation | Résultat attendu |
| --- | --- | --- |
| Manifestations | Créer une manifestation, la modifier puis rouvrir sur un autre appareil connecté au même TEST | Données identiques, pas de doublon |
| Tâches | Créer deux tâches, cocher une seule, recharger | Un seul état « fait » persiste |
| Bénévoles | Ajouter une personne fictive avec téléphone et courriel, modifier les coordonnées | Affichage et export exacts, sans fuite à un compte non autorisé |
| Exposants et groupes | Créer un contact de chaque type, puis rechercher et exporter | Catégories et coordonnées conservées |
| Écocups | Stock initial 100, sortie 70, seuil 30 | Solde 30, alerte active au seuil |
| Écocups | Retour 10, puis tentative de sortie 50 | Solde 40 puis refus du mouvement invalidant le stock ; aucune écriture partielle |
| CSV | Exporter accents, points-virgules, retours ligne et texte commençant par = | Colonnes intactes et formule neutralisée |
| Mobile | Tester 360 px et 390 px, clavier virtuel ouvert | Actions accessibles, pas de défilement horizontal bloquant |
| Droits | Essayer lecture/écriture depuis un compte sans autorisation | Refus côté base (RLS), pas seulement dans l'interface |
| Sauvegarde | Export TEST puis restauration dans un TEST vierge | Totaux, identifiants et relations cohérents |
| Reprise | Simuler coupure réseau pendant une sauvegarde ou écriture | Pas de perte silencieuse, pas de doublon au réessai |

## Preuves à conserver
Consigner pour chaque scénario : date, branche et SHA, environnement TEST, rôle, résultat attendu/obtenu, capture si échec et ticket correctif. Ne jamais enregistrer mots de passe, jetons ou coordonnées réelles dans les preuves.

## Décision de mise en service
Ne pas présenter l'application comme multiutilisateur opérationnelle avant validation explicite des tests de persistance entre appareils, des politiques RLS, des sauvegardes/restaurations et de la migration additive. La CI de tests unitaires ne prouve pas à elle seule ces garanties. La fusion, le déploiement et toute opération sur une base réelle restent soumis à une validation humaine distincte.
