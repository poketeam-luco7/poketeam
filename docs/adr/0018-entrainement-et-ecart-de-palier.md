# ADR 0018 — Entraînement dans les paliers terminés et écart de palier maximal

- **Statut** : acceptée
- **Date** : 2026-10-14
- **Complète** : [ADR 0015](0015-progression-capture.md)

## Contexte

Une run ne propose que des Pokémon dont le dresseur n'a pas encore la ligne, et capturer un
premier stade retire toute sa ligne de tous les paliers. Les paliers faibles se vident vite ; une
fois terminés, plus aucune run n'y était possible. Il ne restait que des paliers trop forts pour
des Pokémon de premier stade, qui ne gagnaient plus, donc n'évoluaient plus : **la progression
se bloquait**.

À l'inverse, sans limite, une équipe évoluée pourrait accumuler des victoires sans risque dans
les paliers les plus faibles.

## Décision

- Un palier sans plus rien à capturer devient un **entraînement** : adversaires tirés parmi
  toutes les espèces du palier (déjà battus évités tant que possible), victoires comptées pour
  les évolutions, run terminée sans capture après 3 victoires. Le Pokédex décide (`training`
  dans `/capture/encounters` et dans les paliers) ; Équipes l'enregistre dans la run.
- **Écart de palier maximal** : un Pokémon ne peut pas combattre dans un palier inférieur de
  2 niveaux ou plus au sien (palier = stats de base ÷ 50 ; une Méga utilise ses propres stats).
  Vérifié par le Pokédex (`tooStrong` dans `/capture/analyze` avec le palier), refusé par
  Équipes au lancement de la run (400) ; le front grise ces Pokémon.
- Le parcours devient : **choisir le palier, puis composer l'équipe** pour ce palier.
- Les stats et types propres à chaque Méga sont ajoutés au référentiel statique
  ([ADR 0014](0014-referentiel-capture-statique.md)).

### Amendement du 15 octobre 2026

L'écart de palier maximal ne s'applique plus qu'aux **entraînements**. Pour capturer, une
équipe entre dans le palier de son choix : la règle visait à empêcher d'accumuler des victoires
sans risque, pas à bloquer la capture des Pokémon faibles. Le Pokédex ne renvoie `tooStrong`
que si le palier demandé est un entraînement.

## Conséquences

- ✅ Plus de blocage : il existe toujours un palier où un Pokémon peut gagner des victoires.
- ✅ Les combats restent disputés : on ne peut pas « farmer » avec une équipe bien plus forte.
- ✅ Les paliers faibles restent accessibles par les Pokémon faibles : battre un Papilusion
  (palier 7) donne un Chenipan (palier 3), qui peut ensuite y combattre.
- ✅ Depuis l'amendement, les paliers faibles restent capturables par n'importe quelle équipe ;
  seul l'entraînement y est réservé aux Pokémon proches de ce niveau.

## Alternatives écartées

- **Toujours tirer dans tout le palier** : supprime le blocage, mais rend la capture aléatoire
  dans les paliers presque terminés.
- **Bonus de victoires contre plus fort** : accélère la progression mais ne résout pas le cas où
  aucun palier n'est accessible.
