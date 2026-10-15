# Architecture de PokéTeam

Ce document décrit l'architecture selon le modèle **C4** (contexte, conteneurs, composants),
puis les flux principaux et les modèles de données. Les choix sont justifiés dans les
[ADR](adr/README.md).

---

## Point de départ : le monolithe

Le projet est la **migration** d'une application existante, *Pocket'APP* :

```mermaid
flowchart LR
    F["Front Angular"] --> M["Monolithe NestJS :3000<br/>modules auth · users · teams · pokeapi"]
    M --> DB[("MySQL (XAMPP)")]
    M --> API["PokéAPI"]
```

Problèmes relevés dans le monolithe, corrigés par la migration :

| Problème | Correction |
|---|---|
| Mots de passe stockés en clair | Hachage PBKDF2 dans Dresseurs |
| `GET /users/:mail` public, renvoyait le mot de passe | Route supprimée |
| `PUT /users`, `DELETE /users/:id`, `DELETE /teams/:id` sans contrôle d'accès | Identité via JWT, vérification du propriétaire |
| Secret JWT en dur dans le code | Variable d'environnement (`.env`) |
| ~150 appels successifs à PokéAPI pour lister une génération | 19 appels parallèles mis en cache (1,37 s → 0,025 s au 2ᵉ appel) |
| Boucle qui sautait des Pokémon dans la liste d'une génération | Réécrite dans le Pokédex, testée |

---

## Niveau 1 — Contexte

```mermaid
flowchart TB
    J(["👤 Dresseur<br/>joueur"])
    S["<b>PokéTeam</b><br/>Créer des équipes, les analyser,<br/>les faire s'affronter"]
    P["<b>PokéAPI</b><br/>pokeapi.co<br/>Données Pokémon publiques"]
    J -->|"utilise via son navigateur"| S
    S -->|"lit les Pokémon, types, stats<br/>(HTTPS, JSON)"| P

    classDef sys fill:#1168bd,stroke:#0b4884,color:#fff
    classDef ext fill:#999,stroke:#6b6b6b,color:#fff
    classDef person fill:#08427b,stroke:#052e56,color:#fff
    class S sys
    class P ext
    class J person
```

---

## Niveau 2 — Conteneurs

```mermaid
flowchart TB
    J(["👤 Dresseur"])

    subgraph SYS["PokéTeam — réseau Docker Compose"]
        F["<b>Front</b><br/>Angular 19, Bootstrap 5<br/><i>pages, arène animée</i>"]
        G["<b>API Gateway</b><br/>Node 22, Express<br/><i>routage, vérification JWT, CORS</i>"]
        D["<b>Dresseurs</b><br/>Python, Django + DRF<br/><i>comptes, connexion, émission des JWT</i>"]
        E["<b>Équipes</b><br/>Python, Django + DRF + pymongo<br/><i>équipes, droits d'accès, progression</i>"]
        P["<b>Pokédex</b><br/>Python, FastAPI — sans état<br/><i>façade PokéAPI, règles des types, calculs</i>"]
        PG[("<b>PostgreSQL 16</b><br/>table des dresseurs")]
        MG[("<b>MongoDB 7</b><br/>collection teams")]
    end

    API["<b>PokéAPI</b><br/>externe"]

    J -->|"HTTP :4200"| F
    F -->|"REST JSON + Bearer JWT<br/>:3000 — seul port exposé"| G
    G -->|"/auth, /users"| D
    G -->|"/teams"| E
    G -->|"/pokeapi/*"| P
    E -->|"REST interne<br/>/teams/analyze, /teams/compare,<br/>/capture/*, /dungeons/*, /boss/fight"| P
    D --> PG
    E --> MG
    P -->|"HTTPS + cache mémoire"| API

    classDef c fill:#438dd5,stroke:#2e6295,color:#fff
    classDef db fill:#438dd5,stroke:#2e6295,color:#fff
    classDef ext fill:#999,stroke:#6b6b6b,color:#fff
    class F,G,D,E,P c
    class PG,MG db
    class API ext
```

| Conteneur | Responsabilité | Ne fait **pas** |
|---|---|---|
| Gateway | Point d'entrée unique, **authentification** (qui es-tu ?), CORS | Aucune règle métier |
| Dresseurs | Identité : comptes, mots de passe hachés, émission des JWT | Vérifier les JWT (c'est la gateway) |
| Équipes | Ce que possède le dresseur : équipes, **autorisation** (est-ce ton équipe ?), persistance | Aucune règle de type Pokémon |
| Pokédex | Toute la connaissance Pokémon : données, types, faiblesses, analyse, formule de combat, capture, donjons, boss final | Aucun stockage, aucune notion d'utilisateur |

---

## Niveau 3 — Composants du Pokédex

Le service central du domaine est découpé en trois couches.

```mermaid
flowchart TB
    subgraph PK["Pokédex (FastAPI)"]
        M["<b>main.py</b> — interface HTTP<br/>routes, validation Pydantic, codes d'erreur"]
        A["<b>pokeapi.py</b> — Anti-Corruption Layer<br/>traduit PokéAPI en profils simples,<br/>index des Pokémon, formes, cache mémoire"]
        L["<b>logic.py</b> — domaine pur<br/>multiplicateurs de types, summary, analyse,<br/>suggestions, formule d'affrontement"]
        C["<b>capture.py · dungeons.py</b> — domaine pur<br/>paliers, évolutions, formes, donjons, boss final<br/>(référentiel statique data/capture.json)"]
    end
    M --> A
    M --> L
    M --> C
    A --> L
    A -->|"seul point réseau : _fetch()"| API["PokéAPI"]
```

- `logic.py` n'a **aucune dépendance réseau** : il est testé avec des données en dur.
- `pokeapi.py` est le **seul** fichier qui connaît le format de PokéAPI ; ses tests remplacent
  `_fetch()` par une fausse PokéAPI.

---

## Flux principaux

### Création d'une équipe

```mermaid
sequenceDiagram
    autonumber
    actor J as Dresseur
    participant F as Front
    participant G as Gateway
    participant E as Équipes
    participant P as Pokédex
    participant M as MongoDB

    J->>F: choisit 1 à 6 Pokémon parmi ceux qu'il a capturés
    F->>G: POST /pokeapi/teams/analyze (à chaque ajout)
    G->>P: /teams/analyze
    P-->>F: grille des 18 types + suggestions
    J->>F: Valider
    F->>G: POST /teams + Bearer JWT
    G->>G: vérifie le JWT, pose X-User-Id
    G->>E: POST /teams
    E->>M: Pokémon débloqués du dresseur (captures)
    E->>P: POST /capture/analyze (ids + débloqués)
    P->>P: profils (cache ou PokéAPI) + summary
    P-->>E: membres + summary + Pokémon non débloqués
    E->>E: règles : capturés uniquement (403), 1 à 6 Pokémon, Species Clause, 1 Méga max
    E->>M: insert (instantanés + summary)
    E-->>F: 201 équipe créée
```

### Affrontement (versus)

```mermaid
sequenceDiagram
    autonumber
    participant F as Front
    participant G as Gateway
    participant E as Équipes
    participant M as MongoDB
    participant P as Pokédex

    F->>G: POST /teams/A/versus/B + JWT
    G->>E: X-User-Id
    E->>M: charge A et B
    E->>E: A et B sont-elles à moi ou publiques ?
    E->>P: POST /teams/compare (deux summaries)
    P->>P: score défensif, avantage, multiplicateur borné
    P-->>E: vainqueur + détail du calcul
    E-->>F: résultat + membres (sprites) pour l'animation
    Note over F: Mise en scène : intro, attaques par type, K.O.<br/>Le résultat n'est pas stocké.
```

### Donjons et boss final

```mermaid
sequenceDiagram
    participant F as Front
    participant E as Équipes
    participant M as MongoDB
    participant P as Pokédex
    F->>E: POST /dungeons/150/fight {teamId} (via la gateway)
    E->>M: l'équipe (propriétaire, Pokémon tous capturés) et la progression
    E->>P: POST /dungeons/fight (summary de l'équipe, Pokémon débloqués)
    P->>P: mode ouvert (≥ 25 capturés) ? donjon visible ? stats ≥ 3 × celles du Pokémon ?
    P-->>E: 400 avec la raison, ou combat (Pokémon × 4) + récompense
    E->>M: si victoire : $addToSet de la récompense, $inc des victoires de chaque membre
    E-->>F: combat à mettre en scène + Pokémon obtenu
```

Le boss final suit le même chemin (`POST /teams/:id/boss` puis `/boss/fight`) avec un seul
Pokémon fixe, Éthernatos Infinimax ; une victoire est enregistrée dans la progression
([ADR 0019](adr/0019-donjons-et-boss-final.md)).

---

### Mode Capture : un combat de run

```mermaid
sequenceDiagram
    autonumber
    participant F as Front
    participant E as Équipes
    participant M as MongoDB
    participant P as Pokédex
    F->>E: POST /capture/run/fight {wildId} (via la gateway)
    E->>M: progression du dresseur (run en cours avec son équipe figée)
    E->>E: wildId fait-il partie des 3 adversaires proposés ?
    E->>P: POST /capture/fight (summary, sauvage, taille de l'équipe)
    P-->>E: résultat (sauvage adapté à la taille de l'équipe)
    E->>M: si victoire : $inc victoires de chaque membre, manche suivante<br/>(conditionné au n° de manche : pas de double comptage)
    E->>P: POST /capture/state (collection, victoires)
    P-->>E: évolutions débloquées, choix en attente, paliers
    E->>M: $addToSet des évolutions débloquées
    E-->>F: combat à mettre en scène + nouvelle progression
```

L'équipe de la run est composée au lancement (`POST /capture/run {tier, pokemonIds}`) :
Équipes la fait analyser par le Pokédex (`/capture/analyze`, qui refuse les Pokémon non
débloqués), puis stocke ses instantanés et son summary dans la run. Elle reste figée jusqu'à la
capture ou la défaite, et chaque combat n'a plus besoin de la réanalyser.

### Les Pokémon capturés, droit d'utilisation partout

La même vérification (`/capture/analyze`, cf. création d'équipe) protège la création et la
modification d'équipe. Pour le versus et le boss, Équipes appelle `POST /capture/locked` avec
chaque équipe et les Pokémon débloqués de **son** dresseur : une équipe créée avant ce contrôle
et contenant un Pokémon non capturé est refusée (409). Les listes d'équipes portent le même
calcul dans un champ `locked` ([ADR 0016](adr/0016-pokemon-debloques-droit-utilisation.md)).

## Modèles de données

### PostgreSQL — Dresseurs

```mermaid
erDiagram
    ACCOUNTS_DRESSEUR {
        bigint id PK
        varchar mail UK
        varchar nom
        varchar prenom
        varchar photo_profil
        varchar password "PBKDF2, jamais en clair"
        timestamptz created_at
    }
```

### MongoDB — Équipes (collection `teams`)

Une équipe est un **agrégat** lu et écrit d'un seul bloc ; elle embarque un instantané de
chaque Pokémon et son summary pré-calculé.

```json
{
  "_id": "6710a3…",
  "userId": "1",
  "nom": "Team Eau",
  "isPublic": true,
  "members": [
    {
      "pokemonId": 9, "name": "blastoise", "isMega": false, "isForm": false,
      "sprite": "https://…/9.png", "types": ["water"],
      "stats": { "hp": 79, "attack": 83, "defense": 100, "spAtk": 85, "spDef": 105, "speed": 78 },
      "statTotal": 530,
      "weaknesses": ["electric", "grass"],
      "resistances": ["fire", "water", "ice", "steel"]
    }
  ],
  "summary": {
    "statTotal": 1605,
    "weak": { "electric": 3, "grass": 2 },
    "resist": { "fire": 2, "water": 3, "ice": 2, "steel": 2 },
    "offensiveTypes": ["water", "ice", "flying"]
  }
}
```

### MongoDB — progression du mode Capture (collection `captures`)

Un document par dresseur. Les règles (seuils, rencontres) sont dans le Pokédex ; Équipes ne
fait que stocker et appliquer, par des opérations atomiques.

```json
{
  "userId": "1",
  "starter": 4,
  "unlocked": [4, 5, 174, 746],
  "victories": { "charmander": 12, "charmeleon": 3 },
  "run": {
    "tier": 3, "round": 2, "reward": false,
    "team": [{ "pokemonId": 5, "name": "charmeleon", "baseSpecies": "charmeleon", "...": "instantané" }],
    "summary": { "statTotal": 405, "weak": {}, "resist": {}, "offensiveTypes": ["fire"] },
    "candidates": [{ "id": 191, "name": "sunkern", "statTotal": 180, "firstStage": { "id": 191 } }],
    "defeated":   [{ "id": 298, "name": "azurill", "firstStage": { "id": 298 } }]
  },
  "choices": []
}
```

Il n'y a plus de clé étrangère entre dresseurs et équipes : `userId` est une simple valeur
fournie par la gateway ([ADR 0004](adr/0004-persistance-polyglotte.md)).

---

## Déploiement (Docker Compose)

| Conteneur | Image | Port exposé à l'hôte | Dépend de |
|---|---|---|---|
| gateway | `node:22-alpine` | **3000** | dresseurs, equipes, pokedex |
| dresseurs | `python:3.12-slim` + gunicorn | – (8001 interne) | postgres (healthcheck) |
| equipes | `python:3.12-slim` + gunicorn | – (8002 interne) | mongo, pokedex |
| pokedex | `python:3.12-slim` + uvicorn | – (8000 interne) | PokéAPI (internet) |
| postgres | `postgres:16-alpine` | – | volume `pg_data` |
| mongo | `mongo:7` | – | volume `mongo_data` |

Les secrets (`JWT_SECRET`, `DJANGO_SECRET_KEY`) viennent du fichier `.env`. `JWT_SECRET` est le
seul secret partagé : Dresseurs **signe** les tokens, la gateway les **vérifie**.

### Un dépôt par composant

Chaque conteneur applicatif a son dépôt, sa CI et son cycle de vie ; le dépôt `poketeam` ne
contient que l'orchestration et la documentation
([ADR 0017](adr/0017-un-depot-par-composant.md)).

```mermaid
flowchart LR
    subgraph ORG["Organisation GitHub"]
        O["poketeam<br/><i>docker-compose, docs, ADR</i>"]
        F["poketeam-front"]
        G["poketeam-gateway"]
        D["poketeam-dresseurs"]
        E["poketeam-equipes"]
        P["poketeam-pokedex"]
    end
    O -.->|"build: ../poketeam-*"| G & D & E & P
    F & G & D & E & P -->|"push"| CI["GitHub Actions<br/>tests + build de l'image"]
```

Les contrats entre dépôts sont les API REST (routes de la gateway, routes internes du
Pokédex) : un service peut évoluer et être testé seul tant qu'il respecte son contrat, ce que
vérifient ses tests (les autres services y sont simulés).
