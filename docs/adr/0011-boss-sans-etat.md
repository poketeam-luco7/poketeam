# ADR 0011 — Boss de la semaine déduit de la date

- **Statut** : remplacée par [ADR 0019](0019-donjons-et-boss-final.md)
- **Date** : 2026-10-13

## Contexte

Un boss doit changer chaque semaine et être le même pour tous les joueurs. Une solution classique serait de le stocker en base et de le changer par une tâche planifiée.

## Décision

Le boss est **calculé** à partir de la date : `BOSS_CATALOG[(année × 100 + n° de semaine ISO) mod taille du catalogue]`. Ses stats de base sont multipliées par 5, et ses faiblesses et résistances comptent pour 3 Pokémon, pour qu'un seul Pokémon tienne tête à une équipe de 6. Le combat réutilise la formule du versus.

## Conséquences

- ✅ Aucune base, aucune tâche planifiée : le **Pokédex reste sans état**.
- ✅ Déterministe et testable : deux appels la même semaine donnent le même boss.
- ⚠️ Rotation prévisible ; pas de boss « événement » choisi manuellement sans modifier le code.

## Alternatives écartées

- **Boss stocké en base + cron** : ajoute un état et une tâche à surveiller pour un besoin qui s'en passe.
- **Boss aléatoire** : différent d'un joueur à l'autre, contraire au principe.
