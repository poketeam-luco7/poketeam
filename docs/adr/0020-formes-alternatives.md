# ADR 0020 — Formes alternatives : équivalentes d'office, améliorées à mériter

- **Statut** : acceptée
- **Date** : 2026-10-15
- **Complète** : [ADR 0016](0016-pokemon-debloques-droit-utilisation.md), [ADR 0019](0019-donjons-et-boss-final.md)

## Contexte

Les formes alternatives suivaient toutes leur espèce : posséder Superdofin donnait Superdofin
Héros (650 de stats au lieu de 457), posséder Kyurem donnait Kyurem Noir. Dans le mode Capture,
à l'inverse, aucune forme n'était disponible, pas même celles qui ne changent que le type
(Shifours Mille Poings).

## Décision

Le référentiel statique reçoit les 154 formes alternatives des données de PokéAPI (mêmes
exclusions que la façade : Gigamax, Totem, Pikachu cosplay…), classées automatiquement :

- **Équivalente** (gain de stats ≤ 20 : Shifours Mille Poings, Giratina Originel, formes
  régionales…) : elle suit son espèce, partout, y compris dans l'équipe de run.
- **Améliorée** (gain > 20, 33 formes) : elle doit être débloquée elle-même.
  - Pokémon non légendaire, sans fusion (Superdofin Héros, Motisma, Darumacho Transe,
    Météno Noyau…) : **30 victoires** avec l'espèce, comme une évolution.
  - Légendaire (Zygarde Parfait, Necrozma Ultra, Primo-Groudon, Zacian Couronné…) : un
    **donjon**, visible quand on possède l'espèce.
  - **Fusion** (Kyurem Noir et Blanc, Necrozma Crinière du Couchant et Ailes de l'Aurore,
    Sylveroy Cavalier) : un donjon visible seulement si l'on possède **l'espèce et son
    partenaire**.

`is_allowed` (Pokédex) traite une forme améliorée comme une Méga : elle doit figurer dans les
Pokémon débloqués. La création d'équipe, le versus et le boss en héritent sans changement.

## Conséquences

- ✅ Plus de puissance gratuite : un gain de stats se mérite, au combat ou en donjon.
- ✅ Classement calculé depuis les stats, pas une liste écrite à la main : une nouvelle forme
  ajoutée à PokéAPI est classée en régénérant le référentiel.
- ⚠️ Une équipe enregistrée avec Superdofin Héros avant cette règle devient verrouillée
  ([ADR 0016](0016-pokemon-debloques-droit-utilisation.md)).
- ⚠️ Les formes régionales sont traitées comme équivalentes pour l'instant ; en faire des
  rencontres à part entière dans le mode Capture est une suite possible.
