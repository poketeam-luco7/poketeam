# ADR 0019 — Donjons pour les légendaires et les Méga, boss final fixe

- **Statut** : acceptée
- **Date** : 2026-10-14
- **Remplace** : [ADR 0011](0011-boss-sans-etat.md) (boss de la semaine)
- **Complète** : [ADR 0015](0015-progression-capture.md), [ADR 0018](0018-entrainement-et-ecart-de-palier.md)

## Contexte

Dans le mode Capture, les légendaires et fabuleux (580 à 720 de stats) tombent dans les
derniers paliers, où presque aucune équipe ne gagne, et les Méga se débloquaient
mécaniquement après 50 victoires. Le boss de la semaine, lui, n'apportait rien à la
progression. Il manquait un objectif de fin de partie.

## Décision

- Les **lignes légendaires et fabuleuses** (94 espèces, d'après `is_legendary` / `is_mythical`
  des données de PokéAPI) et **toutes les Méga** sortent du mode Capture : plus de rencontre
  en run, plus de Méga aux victoires. Les Pokémon déjà obtenus restent acquis.
- Chacun a un **donjon** : un par espèce légendaire ou fabuleuse (la victoire donne le premier
  stade de sa ligne), un par Méga (visible quand on possède l'espèce qui méga-évolue).
- Le mode s'ouvre à **25 Pokémon capturés**. Entrée : total des stats de l'équipe
  **≥ 3 ×** celles du Pokémon. Combat : la formule du versus, le Pokémon ayant ses stats **× 4**
  et ses faiblesses et résistances comptant pour 3. Défaite sans pénalité ; chaque victoire
  compte pour l'évolution des membres.
- On entre avec une **équipe enregistrée** : elle ne contient que des Pokémon capturés
  ([ADR 0016](0016-pokemon-debloques-droit-utilisation.md)), et c'était déjà le fonctionnement
  du boss.
- Le boss de la semaine devient un **boss final fixe**, **Éthernatos Infinimax** (1 125 de
  stats), soumis aux mêmes règles (entrée à 3 375, × 4 en combat). Sa défaite est enregistrée
  dans la progression du dresseur.
- Répartition inchangée : le **Pokédex décide** (catalogue, visibilité, seuils, combat, sans
  état) et renvoie un 400 motivé ; **Équipes vérifie l'équipe et enregistre** (récompense par
  `$addToSet`, victoires par `$inc`).

## Conséquences

- ✅ Un objectif de fin de partie en trois étapes : remplir le Pokédex, conquérir les donjons,
  battre Éthernatos Infinimax.
- ✅ Les paliers de capture ne contiennent plus de Pokémon quasi imbattables.
- ✅ Le boss final reste sans état côté Pokédex, comme l'ancien boss.
- ⚠️ Les premiers stades des lignes légendaires (Cosmog, Kubfu, Type:0…) ont des donjons
  faciles : la ligne s'obtient tôt, puis évolue aux victoires. Choix assumé ; on pourrait ne
  garder que les formes finales.
- ⚠️ Plus de rotation hebdomadaire : moins de raison de revenir chaque semaine.

## Alternatives écartées

- **Garder les légendaires en capture** : progression bloquée dans les derniers paliers.
- **Stocker les donjons en base** : inutile, ils se déduisent du référentiel statique.
