# FEST’APP — environnement Supabase TEST isolé (18/11/2026)

## Situation vérifiée
- Organisation : Comité des fêtes de LIERNAIS (cfliernais), formule Free.
- Prix annoncé par Supabase à la création : **0 USD / mois**.
- Projet TEST : `ddpaxzdwxqwypcumjvvn` — `https://ddpaxzdwxqwypcumjvvn.supabase.co`.
- Projet réel (ne pas modifier) : `pomssbugayytzmmgvflg`.
- Espace TEST : `d4dbe793-56bb-4dad-a76c-5ac322b1e5b1`.
- Tables TEST créées : `festapp_spaces`, `festapp_members`, `festapp_snapshots`.
- 0 compte Supabase Auth et 0 compte membre ajouté (constat du 18/11/2026). Aucune donnée du comité copiée dans la base TEST.
- Fichier de schéma pour audit : `docs/sql/festapp_test_schema.sql` (déjà appliqué sur TEST, ne pas réexécuter tel quel).

## Sécurité
- RLS activée sur les 3 tables, pas d'accès anonyme aux données.
- Rôle `viewer` : lecture ; `editor` ou `admin` : lecture et modification du snapshot.
- Écriture par incrément de révision obligatoire ; le conflit bloque l'écrasement d'une version plus récente.
- Aucune modification du projet réel, pas de service_role exposée, pas de fusion sur main.
- Contrôle Supabase Advisor sécurité : aucun signalement sur le projet TEST au 18/11/2026.
- Contrôle SQL en transaction annulée : inconnu bloqué, lecteur non modificateur, éditeur autorisé, ancienne révision rejetée.

## Préparer une session locale TEST
1. Copier `.env.test.example` vers `.env.test` (fichier local non commité).
2. Renseigner **uniquement la clé publishable du projet TEST** depuis Supabase > Project Settings > API Keys.
3. Démarrer `npm run dev -- --mode test`.
4. L'écran « Mes fiches en sécurité » utilise exclusivement l'URL et l'espace TEST dans ce build.
5. Sans la clé TEST, la connexion est désactivée ; jamais de repli silencieux vers le projet réel.

## Synchronisation implémentée dans l'interface TEST
- Connexion avec e-mail et mot de passe via Supabase Auth, **sans inscription publique automatique**.
- Lors de la première connexion, les deux copies sont comparées. Si elles diffèrent, l'utilisateur doit choisir explicitement **envoyer** les fiches locales ou **récupérer** les fiches de TEST. Les deux opérations demandent confirmation et recommandent une sauvegarde ZIP.
- Après activation, les nouvelles saisies locales sont enregistrées à intervalles courts dans le snapshot Supabase TEST (révision conditionnelle). Le serveur est relu pour confirmer la sauvegarde.
- Toutes les 20 secondes, l'application vérifie les changements d'un autre appareil : téléchargement si aucune édition locale en attente, sinon arrêt avec avertissement de conflit. Aucun écrasement automatique des saisies divergentes.
- Le snapshot inclut les modules de fiches, besoins bénévoles, réglages écocups et menus/tarifs de la caisse de démonstration. **Les photos originales et les paniers de caisse ne sont pas synchronisés** ; les conserver avec la sauvegarde ZIP. La caisse ne réalise aucun paiement.
- La clé incluse dans le build TEST est une clé **publishable** publique ; aucune clé admin ou `service_role` n'est publiée.
- Vérification locale : **431 tests réussis**, `npm run build -- --mode test` réussi, panneau de connexion vérifié visuellement dans la prévisualisation.

## Comptes et recette restant à faire
- Créer/inviter **un premier utilisateur** via Supabase Auth dans TEST, puis lui attribuer le rôle `admin` de l'espace TEST dans `festapp_members`. Ne jamais communiquer son mot de passe à un développeur.
- Tester réellement la connexion, l'envoi, la récupération et la modification depuis deux navigateurs/appareils. L'absence actuelle de compte bloque cette validation de bout en bout.
- Ajouter ensuite les membres autorisés (jusqu'à 10) avec leurs rôles, sur décision du président.
- Faire une sauvegarde ZIP complète sur chaque appareil avant la première activation. Ne pas ouvrir l'accès aux bénévoles tant que le contrôle des données n'est pas terminé.

Le helper `src/lib/supabaseTestSync.js` permet des écritures **uniquement si** `testMode: true` est explicitement fourni. Ce parcours est branché à l'interface TEST privée, sans connexion à la base réelle.
