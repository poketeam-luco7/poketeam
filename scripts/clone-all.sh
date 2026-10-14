#!/usr/bin/env bash
# Récupère (ou met à jour) les dépôts des composants à côté de celui-ci.
# Usage : ./scripts/clone-all.sh
set -euo pipefail
ORG="${ORG:-poketeam-lucas}"
cd "$(dirname "$0")/../.."
for c in front gateway dresseurs equipes pokedex; do
  if [ -d "poketeam-$c/.git" ]; then
    echo "↻ poketeam-$c"; git -C "poketeam-$c" pull -q --ff-only
  else
    echo "⤓ poketeam-$c"; git clone -q "https://github.com/$ORG/poketeam-$c.git"
  fi
done
