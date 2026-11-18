# FEST’APP — environnement Supabase TEST isolé (18/11/2026)

## Situation vérifiée
- Organisation : Comité des fêtes de LIERNAIS (cfliernais), formule Free.
- Prix annoncé par Supabase à la création : **0 USD / mois**.
- Projet TEST : `ddpaxzdwxqwypcumjvvn` — `https://ddpaxzdwxqwypcumjvvn.supabase.co`.
- Projet réel (ne pas modifier) : `pomssbugayytzmmgvflg`.
- Espace TEST : `d4dbe793-56bb-4dad-a76c-5ac322b1e5b1`.
- Tables TEST créées : `festapp_spaces`, `festapp_members`, `festapp_snapshots`.
- 0 compte membre ajouté. Aucune donnée du comité copiée.
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
4. L'écran « Espace du comité 🧪 TEST » utilise exclusivement l'URL et l'espace TEST.
5. Sans la clé TEST, la connexion est désactivée ; jamais de repli silencieux vers le projet réel.

## Comptes et recette restant à faire
- Recueillir les adresses des membres autorisés (jusqu'à 10) et choisir qui sera administrateur.
- Créer/inviter les utilisateurs via Supabase Auth dans TEST puis leur attribuer leur appartenance `festapp_members` (pas d'inscription publique automatique).
- Vérifier les connexions réelles de deux comptes sur deux appareils ; tester lecture, écriture, refus d'accès et conflits.
- Faire une sauvegarde avant toute importation de données réelles ; pas de synchronisation automatique ni de déploiement à ce stade.

Le helper `src/lib/supabaseTestSync.js` permet des écritures **uniquement si** `testMode: true` est explicitement fourni. Il n'est pas branché sur l'interface de production.
