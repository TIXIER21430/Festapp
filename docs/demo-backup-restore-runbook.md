# Procédure de sauvegarde et de restauration — démonstration FEST'APP

> **Périmètre : données locales de démonstration uniquement.** Cette procédure ne sauvegarde pas Supabase et n'autorise aucune écriture sur une base réelle.

## Sauvegarde avant essai
1. Depuis l'interface de démonstration, exporter la sauvegarde JSON via la fonction dédiée.
2. Conserver deux copies datées dans des emplacements distincts et protégés (les contacts contiennent des données personnelles).
3. Vérifier que le JSON contient `format: "festapp-demo-backup"`, `version: 1`, `exportedAt` et `data`.
4. Prévisualiser le nombre d'enregistrements par catégorie avant toute tentative de restauration. Ne jamais confondre une sauvegarde de démonstration avec une sauvegarde de production.

## Restauration en environnement isolé
1. Travailler sur un profil de navigateur de test, sans session Supabase de production.
2. Conserver une copie de l'état de test actuel avant import.
3. Valider le JSON avec `parseDemoBackup` / `previewDemoBackup`. Un fichier invalide, trop volumineux ou d'une version inconnue doit être refusé.
4. Vérifier les mouvements écocups avec `inspectEcocupBackup` et `inspectCombinedEcocupSettings`. Les nouveaux exports contiennent le stock initial et le seuil correspondant, mais **l'import ne les applique jamais automatiquement** : recopier et vérifier ces deux valeurs dans la démonstration avant de restaurer des mouvements. L'import est bloqué si leur solde serait invalide avec les réglages courants.
5. Contrôler les doublons et les liens manifestations–tâches. Ne pas corriger automatiquement les correspondances ambiguës.
6. Importer uniquement dans un jeu de test, puis comparer les nombres d'enregistrements et le stock final attendu. Vérifier particulièrement qu'une tâche conserve sa manifestation (`eventId`), son étape (`phase` : Avant, Veille, Jour J) et sa case cochée (`done`) après restauration. Les anciennes fiches sans ces métadonnées restent compatibles.
7. En cas d'écart, interrompre l'essai et revenir à la copie précédente. Ne jamais écraser des données réelles.

**Limite du fichier :** l'ensemble du JSON, y compris les besoins bénévoles et les réglages écocups, doit tenir dans 10 Mo (octets UTF-8). Si l'export affiche un refus, les fiches locales restent présentes mais **aucune sauvegarde exploitable n'a été téléchargée**. Réduire la taille des données de test ou répartir les essais avant de retenter. Ne jamais considérer un export refusé comme une sauvegarde réussie.

**Si un stockage local est illisible :** FEST'APP se verrouille en lecture seule dès le chargement des fiches, des besoins bénévoles ou des réglages écocups. Ne pas vider le cache, réinitialiser le navigateur ni tenter une restauration dans ce profil : cela pourrait rendre la donnée d'origine irrécupérable. Conserver l'appareil et demander un diagnostic avant toute correction. Le bouton d'export JSON refuse de produire une sauvegarde potentiellement incomplète.

## Avant une mise en service partagée (non réalisée)
- Créer un projet Supabase de test indépendant, avec clés et utilisateurs de test distincts.
- Prévoir migrations **additives** versionnées, RLS activée et tests d'autorisation (10 membres du bureau ; bénévoles sans accès).
- Définir sauvegarde transactionnelle côté serveur, procédure de restauration testée et journal d'audit.
- Prévoir une transaction serveur atomique pour chaque mouvement écocup afin d'éviter les stocks négatifs en accès simultané.
- Vérifier les droits d'export des coordonnées et les durées de conservation RGPD.
- Exiger validation explicite avant toute modification d'une base réelle, fusion, déploiement ou service payant.

**Compatibilité :** les anciens fichiers de sauvegarde de démonstration restent acceptés, mais ne contiennent pas le stock initial ni le seuil d'alerte écocups. Ces valeurs doivent alors être retrouvées et vérifiées manuellement. Une sauvegarde JSON locale ne constitue toujours pas une sauvegarde Supabase.
