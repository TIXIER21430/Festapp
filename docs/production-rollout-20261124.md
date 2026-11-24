# FEST’APP — mise en service contrôlée (24 novembre 2026)

## Périmètre
- Projet Supabase : `pomssbugayytzmmgvflg`.
- Espace du comité : `83d56d91-ecee-4d07-8d1f-ca8fd686f0eb`.
- Code isolé sur `feat/production-auth-backups-20261124`. Ne pas fusionner `main` automatiquement.
- Hébergement indépendant prévu : GitHub Pages `https://tixier21430.github.io/Festapp/`. Vérifier que le workflow `FESTAPP production - GitHub Pages` a réellement réussi avant de communiquer le lien.
- **Aucune invitation aux neuf autres membres avant la recette complète du compte administrateur.**

## Configuration Auth à effectuer après déploiement
Dans Supabase > Authentication > URL Configuration, ajouter **exactement**
`https://tixier21430.github.io/Festapp/` aux Redirect URLs. Une fois les tests terminés, la définir comme Site URL principale. Conserver temporairement l’ancienne adresse si des liens en cours l’utilisent. Ne jamais autoriser de wildcard de redirection non maîtrisé.

Le compte administrateur déjà confirmé peut utiliser « Créer ou retrouver mon mot de passe » depuis la nouvelle page. Le lien de récupération doit revenir à GitHub Pages ; sinon revoir Redirect URLs. Aucun compte ChatGPT n’est requis sur GitHub Pages.

## Recette avant ouverture des invitations
1. Ouvrir la nouvelle adresse en navigation privée : vérifier que l’écran de connexion s’affiche **avant** les fiches.
2. Vérifier qu’une personne anonyme ne peut pas lire les tables `festapp_members`, `festapp_snapshots`, `festapp_drive_files` ni le bucket privé.
3. Tester le compte administrateur : connexion, déconnexion, récupération de mot de passe, refus d’accès sans adhésion.
4. Dans « Plus > Sauvegarde et synchronisation », comparer la copie locale et la révision du comité. Choisir explicitement « Récupérer » ou « Envoyer » après avoir vérifié les fiches ; aucun écrasement automatique initial.
5. Modifier une fiche test, vérifier l’incrément de révision et la relecture du serveur, puis retrouver la modification après rechargement.
6. Archiver un ZIP privé contenant une photo test ; vérifier dans Supabase Storage que le ZIP existe, puis le télécharger et tester son intégrité et sa restauration en environnement isolé.
7. Pour valider **réellement** la synchronisation multi-utilisateur, créer un deuxième compte test autorisé séparé ou inviter un membre seulement après accord explicite ; vérifier les changements sur deux appareils et les conflits de révision.
8. Préparer les neuf invitations individuelles, avec rôle adapté. Ne pas les envoyer avant la validation de ces tests.

## Sécurité et limites connues
- Le dépôt GitHub est public : n’y commettre **aucun** mot de passe, jeton de session, clé service_role ou liste nominative du bureau. Seule la clé Supabase **publishable** peut être intégrée au navigateur.
- La connexion Supabase et les politiques RLS protègent les données, pas la simple visibilité du code du site.
- Les photos originales restent sur l’appareil où elles ont été ajoutées. Les archives ZIP privées les incluent, mais les photos ne sont pas encore synchronisées individuellement en direct entre tous les appareils.
- Les ZIP automatiques sont créés **uniquement lorsque l’application est ouverte**, après synchronisation et avec un intervalle minimum de 15 minutes ; ce n’est pas une tâche serveur permanente.
- La taille maximale d’une archive est de 40 Mo. Un échec de sauvegarde doit être visible et contrôlé ; conserver un export local.
- Chaque auteur ne peut consulter que ses propres ZIP selon les politiques Storage actuelles.
- Le catalogue de références Drive est privé dans Supabase, mais l’ouverture des documents d’origine dépend toujours des droits Google Drive.
- Les données locales du navigateur ne sont pas chiffrées : éviter les ordinateurs partagés et ne pas confondre déconnexion avec effacement du stockage local.
- La protection Supabase contre les mots de passe compromis était signalée comme désactivée lors de l’audit ; à activer dans Auth > Security lorsque disponible.

## Statut de vérification
- Tests unitaires et compilation : consulter le workflow GitHub de la branche.
- Connexion réelle du compte administrateur à Supabase : confirmée par `auth.users`.
- Deux appareils et deux comptes : **non encore testés de bout en bout**.
- ZIP de production téléchargé après envoi : **non encore testé**, aucun ZIP présent au dernier contrôle.
- Ne pas qualifier l’application de « prête pour dix membres » avant la recette ci-dessus.
