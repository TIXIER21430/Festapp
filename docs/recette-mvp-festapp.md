# FEST'APP — protocole de recette MVP (environnement de test uniquement)

> Document de préparation. Aucun script de migration ni déploiement n'est exécuté par ce document. Ne jamais utiliser la base TIXAPP.

## Conditions préalables
- [ ] Projet Supabase FEST'APP **de test**, séparé de toute base réelle, avec comptes fictifs.
- [ ] Relever les SHA des PR #2, #3, #4, #11 et vérifier leur ordre de dépendance avant intégration.
- [ ] Vérifier que la sauvegarde JSON/CSV ne contient aucune donnée personnelle réelle.
- [ ] Exporter un snapshot de test, vérifier sa lisibilité et pratiquer une restauration sur une autre base de test.
- [ ] Revoir les migrations SQL additives, les contraintes, les index, les politiques RLS, les privilèges EXECUTE et le propriétaire SECURITY DEFINER.
- [ ] Interdire la publication ou fusion tant que les tests suivants ne passent pas.

## Scénarios fonctionnels
| ID | Action | Résultat attendu |
| --- | --- | --- |
| M1 | Créer puis modifier une manifestation et une tâche | Données retrouvées après déconnexion/reconnexion sur un autre navigateur |
| M2 | Terminer une tâche | Statut conservé, plus d'alerte de retard |
| A1 | Ajouter bénévole, exposant, groupe avec coordonnées fictives | Fiches retrouvées, catégories et recherche correctes |
| A2 | Export CSV des contacts fictifs avec accents, virgules et retours à la ligne | Fichier lisible sans colonnes décalées |
| E1 | Stock initial 10, sortie 3 | Solde 7 et mouvement historisé |
| E2 | Stock 2, deux sorties concurrentes de 2 | Une seule réussit, solde jamais négatif |
| E3 | Réémettre la même sortie avec la même clé d'idempotence | Un seul mouvement, un seul débit |
| E4 | Sortie supérieure au solde | Refus explicite, aucune écriture |
| E5 | Solde inférieur ou égal au seuil configurable | Alerte visible sur mobile |
| S1 | Utilisateur anonyme ou membre inactif | Aucune lecture/écriture des données privées |
| S2 | Membre actif du bureau | Accès limité aux opérations autorisées |
| S3 | Tentative d'insertion directe dans le journal écocups | Refus ; passage obligatoire par la RPC |
| R1 | Restaurer un export de test | Totaux, identifiants, relations et historiques inchangés |
| R2 | Simuler import malformé ou doublons | Refus contrôlé sans altération des données |
| U1 | Écran smartphone étroit, clavier virtuel, navigation au doigt | Aucun champ inaccessible, pas de défilement horizontal |

## Preuves de recette à conserver
Pour chaque scénario : date, commit SHA, environnement fictif, commande ou manipulation, résultat obtenu, capture ou journal anonymisé et verdict PASS/FAIL. Ne jamais déposer de secrets, tokens, coordonnées réelles ni dumps privés dans GitHub.

## Critères de mise en service
1. CI verte sur le commit exact ; tests manuels navigateur et PostgreSQL effectués.
2. RLS et concurrence écocups validées sur base isolée.
3. Sauvegarde **et restauration** éprouvées ; plan de retour arrière documenté.
4. Accord explicite du responsable avant toute migration réelle, fusion, mise en ligne ou service payant.

**État :** protocole uniquement ; scénarios non exécutés. Les PR restent indépendantes de ce document et ne sont pas fusionnées.
