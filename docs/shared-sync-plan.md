# FEST’APP — partage des données (préparation, pas de mise en service)

## Situation actuelle
Les fiches, besoins bénévoles et autres informations de démonstration restent **sur chaque appareil**. Le module `sharedSyncContract.js` est une préparation pure : aucune requête réseau ni écriture Supabase.

## Objectif
Un espace unique pour le Comité des fêtes de Liernais, accessible aux dix comptes autorisés, avec une interface mobile simple. La connexion email et les autorisations devront être vérifiées côté serveur (RLS), jamais seulement dans l'interface.

## Conditions avant activation
1. Environnement Supabase **de test** isolé, autorisé par le responsable. Ne pas utiliser la base de production sans accord explicite.
2. Tables par espace associatif et permissions RLS vérifiées par tests avec comptes autorisés et non autorisés.
3. Révisions atomiques côté serveur (CAS ou transaction), pour refuser une écriture basée sur une ancienne version.
4. Sauvegarde préalable et procédure de récupération; migration explicite et contrôlée depuis les données locales.
5. Gestion des erreurs hors ligne : aucune fausse indication « synchronisé », aucune perte silencieuse.
6. Tests de concurrence, déconnexion, comptes sortants et accès aux données personnelles (annuaire).

## Contrat préparé
`makeSharedSnapshot` valide un instantané, `validateSharedSnapshot` refuse les espaces étrangers, et `planSharedWrite` détecte les révisions obsolètes. Ce contrôle client ne remplace **pas** la vérification transactionnelle côté serveur.

Aucun déploiement, aucune synchronisation active, aucune modification de `main`.
