# ADR 0017 — Un dépôt par composant, regroupés dans une organisation

- **Statut** : acceptée
- **Date** : 2026-10-14

## Contexte

Le projet a d'abord vécu dans un seul dépôt (*monorepo*) contenant le front, la gateway, les
trois microservices, le `docker-compose.yml` et la documentation. Le sujet impose que **chaque
microservice ait son propre dépôt**, l'ensemble étant regroupé dans un groupe.

## Décision

- Une **organisation GitHub** regroupe six dépôts : `poketeam-front`, `poketeam-gateway`,
  `poketeam-dresseurs`, `poketeam-equipes`, `poketeam-pokedex`, et `poketeam` pour
  l'**orchestration** (`docker-compose.yml`, `.env.example`, architecture, ADR).
- La gateway et le front ont aussi leur dépôt : ce sont des unités déployables indépendantes,
  même si elles ne comptent pas comme microservices métier.
- **L'historique git est conservé** : chaque dépôt est extrait du monorepo avec
  `git subtree split`, qui ne garde que les commits touchant son dossier.
- Chaque dépôt a **sa CI** (GitHub Actions) : tests du service contre sa vraie base
  (PostgreSQL ou MongoDB en conteneur de service), puis build de l'image Docker.
- `docker-compose.yml` construit les images depuis les **dépôts voisins** (`../poketeam-*`) ;
  `scripts/clone-all.sh` les récupère.

## Conséquences

- ✅ Indépendance réelle : un service se teste, se versionne et se livre seul ; sa CI ne dépend
  pas des autres. C'est ce que permet déjà l'architecture (communication REST, base par service).
- ✅ Droits et revues par dépôt possibles (une équipe par service).
- ⚠️ Un changement de contrat qui touche deux services (ex. nouvelle route du Pokédex utilisée
  par Équipes) demande deux commits dans deux dépôts, à livrer dans le bon ordre
  (le fournisseur avant le consommateur).
- ⚠️ Plus de dépôts à cloner pour lancer le tout : compensé par `clone-all.sh`.
- ⚠️ Les images sont construites localement ; une suite logique serait de les publier sur un
  registre (GitHub Container Registry) depuis chaque CI et de faire référencer des images
  versionnées par `docker-compose.yml`.

## Alternatives écartées

- **Garder le monorepo** : plus simple pour les changements transverses, mais contraire au
  sujet, et il masque le couplage (rien n'empêche un service d'importer le code d'un autre).
- **Sous-modules git** dans le dépôt d'orchestration : épinglent des versions précises, mais
  compliquent chaque mise à jour (`git submodule update`) ; des dépôts voisins suffisent ici.
- **Nouveaux dépôts sans historique** : plus simple, mais on perdrait la trace de la migration
  depuis le monolithe, qui fait partie du livrable.
