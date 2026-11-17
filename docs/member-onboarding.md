# FEST’APP — ouvrir l’accès aux membres

Le projet Supabase du comité est `pomssbugayytzmmgvflg` et son espace est `83d56d91-ecee-4d07-8d1f-ca8fd686f0eb`.

## État
La clé **publique** du projet est configurée dans le client React. La connexion e-mail/mot de passe est possible dès qu'un compte existe. Aucun compte ni adhésion n'a été créé automatiquement. Les données sont consultables en lecture seule ; les données locales ne sont pas remplacées.

## Activation contrôlée
1. Depuis Supabase Auth, inviter ou créer **un compte test** avec une adresse explicitement autorisée par le comité ; éviter les mots de passe partagés.
2. Vérifier l'adresse et l'authentification. Ne pas activer les inscriptions publiques libres pour le comité.
3. Associer l'UUID de ce compte à l'espace via une opération administrateur :

```sql
insert into public.festapp_members (space_id,user_id)
values ('83d56d91-ecee-4d07-8d1f-ca8fd686f0eb', '<UUID AUTH UTILISATEUR>')
on conflict do nothing;
```

4. Tester la connexion : un membre autorisé voit la révision et les compteurs, un compte non membre reçoit un refus.
5. Refaire avec les autres membres après validation. Retirer l'accès d'un membre sortant en supprimant son association à l'espace.

**Sécurité :** ne jamais envoyer de mot de passe dans GitHub ou dans le code. Les comptes sont individuels. La RLS Supabase contrôle la lecture ; la future écriture doit passer par une procédure atomique sécurisée et testée.

**Aucune activation automatique** des écritures partagées, aucune migration des données locales, aucun déploiement sur `main`.
