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
- Persistance durable et partage entre membres, uniquement après validation sur un environnement TEST indépendant.

## État et garde-fous

Le dépôt contient des tests automatisés (notamment sur les exports CSV et la protection des données). Leur présence ne prouve pas que l'ensemble du MVP soit prêt ni que la persistance multiutilisateur ait été validée. Vérifier les résultats GitHub Actions de chaque commit.

Avant toute connexion à une base réelle : tester sur une base TEST isolée, documenter et vérifier les migrations additives, les droits d'accès, la sauvegarde et une restauration complète. Séparer strictement données fictives et données réelles.

Aucune fusion sur `main`, aucun déploiement, aucune suppression de données, aucune modification d'une base Supabase réelle ni engagement payant sans validation explicite.
