# FEST'APP

Application indépendante du Comité des fêtes de Liernais.

Le bureau comprend 10 membres ayant les mêmes droits. Les bénévoles ne se connectent pas.

## État du développement

Le prototype React/Vite sauvegarde actuellement les données dans le navigateur uniquement. **Les données ne sont pas encore partagées.** Les modules manifestations, tâches, achats, stocks, écocups, annuaire, planning bénévoles, retours terrain, recettes de cuisine et finances sont à l'état de prototype.

## Préparation du mode partagé Supabase

Le code contient un client Supabase dans `src/supabase.js` (authentification et opérations sur les données). Il n'est **pas encore connecté à l'interface** et aucun projet Supabase FEST'APP n'est créé ou relié ici. Ce module ne doit pas être confondu avec une synchronisation active.

**Isolation impérative :** ne jamais utiliser le projet Supabase TIXAPP, ses URL, clés ou tables pour FEST'APP.

1. Créer un **projet Supabase distinct**, au nom du Comité des fêtes, avec un compte administrateur contrôlé par l'association.
2. Dans CE projet, installer et réviser le SQL initial `supabase/schema.sql`. Il active RLS et interdit aux personnes non inscrites de lire ou écrire des données.
3. Depuis le tableau Auth de ce projet, créer/inviter les membres du bureau. Inscrire leurs identifiants dans `festapp_members` depuis l'administration SQL, jamais depuis le navigateur. Aucun utilisateur ne peut s'accorder lui-même l'accès.
4. Définir localement `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY` dans `.env.local` ; ne jamais committer les clés secrètes. `.env.example` reste vide.
5. Vérifier dans le projet les droits SQL et les règles RLS ; essayer l'accès sans connexion, depuis un compte hors bureau et depuis un compte membre. Vérifier les conseillers de sécurité Supabase.
6. Seulement après ces tests, relier l'interface aux fonctions de `src/supabase.js`, avec un mécanisme explicite d'import des sauvegardes locales et gestion des conflits. Ne pas copier automatiquement les données du navigateur dans le cloud.

Le schéma est un **brouillon d'installation initiale**, pas une migration appliquée. Il ne faut pas le lancer à nouveau sur une base existante sans revue. La compilation GitHub Actions contrôle le code, pas les accès réels à Supabase.

## Développement

```sh
npm install
npm run dev
npm run build
```

Éviter les fusions automatiques dans `main` avant revue et tests.

## Démonstration et tests

Sur une branche de travail, GitHub Actions lance les tests métier (`npm test`) puis la compilation (`npm run build`). Le résultat compilé est conservé dans un artefact nommé `festapp-demo` pendant 14 jours.

- Pour un test local : `npm install`, puis `npm run dev` et ouvrir l'adresse affichée par Vite.
- Pour tester le résultat compilé : `npm run build`, puis `npx vite preview` et ouvrir l'adresse affichée.
- La compilation utilise des chemins relatifs pour permettre un hébergement sous un sous-dossier.
- L'artefact téléchargeable n'est **pas** un site hébergé : l'accès par URL publique nécessite encore la configuration du déploiement.
- **Ne pas saisir de données personnelles réelles** dans un site de démonstration public non protégé. Les données de test restent dans le navigateur utilisé.

Avant de déclarer la première version prête, vérifier sur ordinateur et smartphone : navigation, ajout/suppression, sauvegarde/restauration, écocups, filtres annuaire, mailing CCI, finance, bénévoles et tâches, puis revue de confidentialité et déploiement.
