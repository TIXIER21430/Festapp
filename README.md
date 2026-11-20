# FEST'APP

Application indépendante du Comité des fêtes de Liernais, développée dans ce dépôt. Les dix membres du bureau sont les utilisateurs prévus ; les bénévoles ne disposent pas de compte.

## Démarrer en local

```bash
npm ci
npm test
npm run build
npm run dev
```

Ces commandes ne doivent ni déployer l'application ni appliquer de migration à une base distante. Ne jamais utiliser de secrets Supabase de production pour des essais.

## Périmètre prioritaire du MVP

- Manifestations et tâches rattachées à une édition identifiée sans ambiguïté.
- Annuaire : bénévoles, exposants et groupes, avec leurs coordonnées.
- Registre des écocups, mouvements et seuil d'alerte.
- Exports CSV et utilisation sur mobile.
- Communication locale : brouillons Facebook à relire et copier, sans publication automatique.
- Photos originales associables aux recettes, publications et archives, stockées sur l'appareil via IndexedDB (hors sauvegarde JSON ; chaque original peut être téléchargé).
- Inventaire matériel, archives et mémoire d'événement en mode démonstration.
- Persistance durable et partage entre membres, uniquement après validation sur un environnement TEST indépendant.

## Compte rendu Word d'une manifestation

Depuis une fête, ouvrir **Autres outils → Compte rendu Word**. Le bilan reprend seulement les écritures, ventes, achats et retours **rattachés à cette édition** : recettes, dépenses saisies, factures en attente incluses dans le solde provisoire, quantités vendues hors annulations, achats prévus, points forts, points faibles et matériel à acheter. Les quantités réellement utilisées peuvent être saisies séparément, sans les confondre avec celles vendues ou prévues.

La rubrique **Choses à ajouter au compte rendu** permet aussi de noter la prochaine réunion, les prochaines manifestations et les observations libres. Chaque ajout est enregistré dans les fiches Retours déjà sauvegardées, sans migration ; les dépenses sans facture sont des écritures Finances provisoires à modifier lors de réception du justificatif (ne pas créer un doublon).

**Télécharger Word** produit un vrai `.docx` modifiable et partageable. **Partager le Word** utilise le menu de partage natif si l'appareil accepte les fichiers Word ; sinon il le télécharge. **Préparer l'e-mail** télécharge le Word et ouvre un brouillon au destinataire choisi, mais **ne peut pas joindre automatiquement le fichier** : l'utilisateur doit l'ajouter avant d'envoyer. Aucun e-mail n'est envoyé en arrière-plan. Les coordonnées privées de l'annuaire ne sont pas incluses.

Ces chiffres restent locaux et provisoires : ni les factures manquantes ni les transactions SumUp externes ne sont récupérées automatiquement. Comparer avec les justificatifs et les encaissements réels avant diffusion.

## État et garde-fous

Le dépôt contient des tests automatisés (notamment sur les exports CSV et la protection des données). Leur présence ne prouve pas que l'ensemble du MVP soit prêt ni que la persistance multiutilisateur ait été validée. Vérifier les résultats GitHub Actions de chaque commit.

Avant toute connexion à une base réelle : tester sur une base TEST isolée, documenter et vérifier les migrations additives, les droits d'accès, la sauvegarde et une restauration complète. Séparer strictement données fictives et données réelles.

Aucune fusion sur `main`, aucun déploiement, aucune suppression de données, aucune modification d'une base Supabase réelle ni engagement payant sans validation explicite.
