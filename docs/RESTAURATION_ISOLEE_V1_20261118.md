# FEST'APP — protocole de restauration isolée (V1)

Date : 2026-11-18. **Document de préparation uniquement : aucune restauration n'est exécutée par ce document.**

## Périmètre et interdictions
- Travailler uniquement sur un projet Supabase TEST indépendant, explicitement identifié par son URL et son project ref. Ne jamais utiliser une clé `service_role` dans le navigateur.
- Ne jamais pointer la démo publique ou la production sur le projet TEST. Ne jamais recopier de coordonnées réelles dans les jeux de données de test.
- Aucune migration destructive, `DROP`, `TRUNCATE`, `DELETE`, désactivation RLS ou modification de la base réelle.
- Les tables et policies du fichier `docs/sql/festapp_test_schema.sql` constituent un exemple TEST, **pas** une migration de production.

## Prérequis avant essai
1. Deux comptes de test distincts (éditeur et lecteur), et un troisième compte hors espace ; identités fictives.
2. Un espace TEST dédié, avec identifiant UUID noté dans le compte-rendu, et un jeu de données fictives (manifestation, tâches, bénévole, exposant, groupe, mouvements écocups).
3. Export JSON versionné, horodaté, avec taille et SHA-256 calculés localement. Conserver deux copies indépendantes, chiffrées si elles contiennent des données personnelles.
4. Capturer le numéro de révision du snapshot, le nombre d'objets par module et les soldes écocups calculés avant tout essai.
5. Confirmer que le projet TEST est isolé et que l'utilisateur dispose d'un accès autorisé. Aucun identifiant secret dans GitHub.

## Scénario de validation (exécution manuelle à autoriser)
1. Exporter un snapshot TEST A, puis relire le fichier et vérifier son empreinte SHA-256.
2. Sur une **copie d'espace TEST** B distincte, prévisualiser l'import : version, structure, objets, doublons, références de manifestations, dates et quantités. Ne rien remplacer silencieusement.
3. Tester un fichier corrompu, une version inconnue, une quantité négative, un identifiant en doublon et un CSV contenant `=1+1` : chacun doit être refusé ou neutralisé sans altérer B.
4. Importer explicitement le snapshot A dans B après confirmation humaine. Relire B et comparer objets, liens tâches/manifestations, bénévoles, exposants/groupes et soldes écocups ; comparer le JSON canonique ou les champs fonctionnels, pas les horodatages serveur.
5. Depuis deux sessions, simuler une modification concurrente à partir de la même révision : la seconde écriture doit échouer sans écraser la première. La révision ne doit avancer que d'une unité par écriture acceptée.
6. Vérifier les droits : lecteur ne peut pas écrire ; éditeur peut modifier le snapshot de son espace uniquement ; compte extérieur ne lit ni n'écrit ; absence de session refuse toute écriture.
7. Vérifier sur téléphone étroit l'édition, la validation, les alertes de seuil écocups et l'export CSV. Aucun téléchargement ne doit révéler les données d'un autre espace.
8. Exporter à nouveau B, vérifier son intégrité et conserver les preuves de tests (résultats, révision, empreintes, captures expurgées).

## Critères d'arrêt / retour arrière
- En cas d'erreur de schéma, conflit de révision, fuite inter-espace, absence de RLS ou sauvegarde non vérifiable : **arrêter les écritures**, conserver les preuves, ne pas forcer la révision.
- Revenir à une copie TEST propre ; ne pas restaurer directement dans l'espace source, et ne jamais écraser un snapshot de production.
- Toute évolution de schéma doit être additive, versionnée, relue et testée sur une base TEST vide puis sur une copie TEST représentative, avec procédure de retour arrière documentée.

## Feuille de résultats à renseigner
| Contrôle | Attendu | Observé | Preuve |
| --- | --- | --- | --- |
| Export / SHA-256 | Empreinte identique | Non exécuté | — |
| Import prévisualisé | Aucun effet avant confirmation | Non exécuté | — |
| Restauration espace B | Données identiques | Non exécuté | — |
| Écriture concurrente | Conflit refusé | Non exécuté | — |
| RLS lecteur / éditeur / extérieur | Droits respectés | Non exécuté | — |
| Écocups / CSV / mobile | Soldes et exports conformes | Non exécuté | — |

**Point bloquant pour la validation réelle :** disposer des comptes de test autorisés et d'une procédure d'import en copie isolée ; cette documentation ne démontre pas une restauration réussie.
