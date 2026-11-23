# FEST’APP — archives automatiques TEST (à valider avant mise en service)

## Besoin

Conserver les fiches et les photos originales du téléphone hors du navigateur,
sans envoyer le carnet d'adresses et les photos privées dans une boîte mail.
Le serveur choisi est **Supabase Storage privé**, distinct de TIXAPP.

## Fonctionnement préparé (branche de développement seulement)

1. Le membre se connecte à **Supabase TEST** avec son compte individuel autorisé.
2. Il vérifie les deux versions (téléphone et serveur) et choisit explicitement laquelle conserver.
3. Il active séparément les archives ZIP avec photos après lecture d'un avertissement.
4. Les fiches se synchronisent selon les révisions existantes ; après confirmation côté serveur,
   le téléphone crée un ZIP comprenant fiches, paramètres, menus, vérifications et photos originales.
5. Le ZIP est envoyé sans écrasement dans `festapp-private-backups-test`, puis téléchargé en retour
   et comparé par SHA-256. L'écran affiche le succès **seulement si la vérification aboutit**.
6. Les nouvelles archives sont espacées d'au moins 15 minutes par session ouverte. Le membre
   peut demander un envoi immédiat ou télécharger son dernier ZIP privé depuis un autre appareil.
7. Récupérer un ZIP ne restaure **jamais** automatiquement ni ne remplace une fiche.

## Limites importantes

- Ni la branche ni le schéma Storage ne sont déployés. **Aucun envoi n'a eu lieu.**
- Le bucket privé et ses politiques RLS figurent dans
  `docs/sql/festapp_storage_backup_TEST_DRAFT_DO_NOT_APPLY.sql` : brouillon non appliqué.
- Les membres TEST doivent être créés puis autorisés dans `festapp_members` ; actuellement
  aucun membre n'a été confirmé dans le projet TEST. Sans eux, aucun ZIP ne part.
- Test de sécurité indispensable : anonyme, compte extérieur, simple lecteur, deux comptes
  du comité, suppression interdite, validation du téléchargement ZIP et restauration sur un
  deuxième appareil. Vérifier aussi le quota de 40 Mo, l'espace de stockage et la facturation.
- Le navigateur **ne travaille pas quand il est fermé**. Les modifications restent en local
  tant qu'elles n'ont pas été synchronisées ; un téléphone hors ligne doit être rouvert.
- Un seul ZIP de moins de 40 Mo est archivable à la fois. Avec plus de photos, conserver un
  export manuel et revoir une stratégie de stockage d'originaux indépendante du ZIP.
- Pas de purge automatique pour éviter toute perte accidentelle. Valider une politique de
  conservation, de chiffrement/accès et de coûts avant activation réelle.
- L'interface existante est une démonstration : ce chantier n'active ni la production,
  ni les comptes réels, ni un déploiement web, ni les e-mails automatiques.

## Conditions de validation humaine

Autorisation spécifique pour (a) créer le bucket et ses règles dans **TEST**, (b) inviter les
comptes TEST, (c) effectuer des essais avec données fictives, puis seulement après recette,
(d) proposer une migration et une activation en **production FEST’APP**. Aucune écriture
vers Supabase production ou modification de `main` sans validation explicite.

En attendant, le ZIP local `festapp-sauvegarde-complete-AAAA-MM-JJ.zip` reste indispensable.
Vérifier sa présence dans les Téléchargements du téléphone et le copier hors du navigateur.
