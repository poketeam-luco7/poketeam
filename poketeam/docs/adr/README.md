# Architecture Decision Records

Chaque décision d'architecture importante est documentée : contexte, décision, conséquences et alternatives écartées.

| N° | Décision | Statut |
|---|---|---|
| 0001 | [Migration progressive du monolithe (Strangler Fig)](0001-migration-strangler-fig.md) | Acceptée |
| 0002 | [API Gateway, authentification centralisée et services non exposés](0002-api-gateway-jwt.md) | Acceptée |
| 0003 | [Découpage en trois microservices](0003-decoupage-services.md) | Acceptée |
| 0004 | [Persistance polyglotte : PostgreSQL et MongoDB](0004-persistance-polyglotte.md) | Acceptée |
| 0005 | [Django pour Dresseurs et Équipes, sans ORM côté MongoDB](0005-django-sans-orm-mongo.md) | Acceptée |
| 0006 | [Pokédex sans état, façade PokéAPI (Anti-Corruption Layer) et cache](0006-pokedex-acl-sans-etat.md) | Acceptée |
| 0007 | [Instantané des Pokémon dans les équipes plutôt qu'une référence](0007-instantanes-pokemon.md) | Acceptée |
| 0008 | [Source unique de vérité des règles Pokémon](0008-source-unique-regles-pokemon.md) | Acceptée |
| 0009 | [Formule d'affrontement et place du calcul](0009-formule-affrontement.md) | Acceptée |
| 0010 | [Communication synchrone REST entre services](0010-communication-synchrone.md) | Acceptée |
| 0011 | [Boss de la semaine déduit de la date](0011-boss-sans-etat.md) | Acceptée |
| 0012 | [Règles de composition validées côté serveur](0012-regles-cote-serveur.md) | Acceptée |
| 0013 | [Secrets et mots de passe](0013-secrets-mots-de-passe.md) | Acceptée |
| 0014 | [Référentiel statique pour le mode Capture](0014-referentiel-capture-statique.md) | Acceptée |
| 0015 | [Progression du mode Capture : stockée par Équipes, décidée par le serveur](0015-progression-capture.md) | Acceptée |
| 0016 | [Les Pokémon capturés, seul droit d'utilisation](0016-pokemon-debloques-droit-utilisation.md) | Acceptée |
| 0017 | [Un dépôt par composant, regroupés dans une organisation](0017-un-depot-par-composant.md) | Acceptée |
| 0018 | [Entraînement dans les paliers terminés et écart de palier maximal](0018-entrainement-et-ecart-de-palier.md) | Acceptée |
