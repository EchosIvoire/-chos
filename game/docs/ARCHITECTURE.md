# Architecture — Aurendel

## Principes non négociables

- **Shards / instances**, pas de monde seamless. Capacité raisonnable par instance
  (cible 20–60). Co-op = instances privées entre amis ; PvP = arènes publiques
  matchmakées. Si une idée dérive vers du "seamless à des milliers", on stoppe.
- **Serveur autoritatif** sur tout ce qui touche progression, loot, économie,
  métiers, cosmétiques. Le client n'est jamais cru (anti-triche by design).
- **Logique de jeu pure découplée** du rendu et du réseau → testable isolément.
- **Cosmétiques sans impact gameplay** (voir `DATA_SCHEMA.md`).

## Découpage

```
game/
  client/   Godot 4.6 (GDScript) — rendu, input, prédiction/interpolation
  server/
    nakama/    config + modules chargés (build TS)
    runtime/   logique autoritative TypeScript (RPC, hooks, validation)
  assets/   concept/ (marketing) vs sprites/ (in-game)
  docs/
```

## Netcode (cible, à implémenter Phase 3)

- Tick serveur **fixe**, état autoritatif diffusé en messages compacts.
- Client : **interpolation** des entités distantes + **reconciliation** du perso
  local (prédiction d'input, correction sur snapshot serveur).
- Nakama : `authoritative match handler` pour les instances de jeu ; on exploite
  les briques natives (auth, matchmaking, parties, storage) avant de réinventer.

## Structure du monde — grande map multi-biomes (décidé 2026-06-14)

Vision : **un grand monde à plusieurs biomes/zones** (zone de départ forêt verte
cozy façon la réf du joueur, puis savane chaude = identité signature, puis autres).

Comment, sans tomber dans le piège MMO :
- Le monde = un **graphe de zones reliées**, chaque zone = une **instance Nakama**
  bornée (cible 20–60 joueurs). Une zone peut être **grande** : le plafond porte
  sur le nombre de joueurs simultanés dans la même boucle serveur, PAS sur la
  taille de la map.
- Transition au passage d'une frontière (court chargement, façon Dofus/Diablo).
  Scale horizontal gratuit : trop de monde dans une zone → Nakama lance une copie.
- **PAS de monde seamless multi-serveurs** (handoff transparent entre process =
  coût pluri-annuel réservé à un éventuel succès, hors scope tant qu'on n'y est pas).
- **Rendu cozy unifié** sur tous les biomes (outline doux, feuillage dense en
  couches, ombres douces, HUD minimal) = cohérence visuelle malgré la variété.

Garde-fou production (solo) : **finir UNE zone à fond** (forêt cozy de départ)
avant d'en ajouter. Pas de carte du monde entière dessinée avant qu'une zone soit
fun à parcourir.

À trancher plus tard : transitions visibles (sortie de zone) vs apparence continue
(zones collées, chargement masqué) — les deux tiennent dans ce modèle.

## Risque majeur tracké : la POPULATION

Arène PvP "peuplée" et économie de skins ne valent rien sans joueurs.
→ Chaque système multijoueur doit **rester fun à 1–2 joueurs** (remplissage IA /
bots PvP) sinon les phases 5–6 sortent dans le vide. À réévaluer à chaque phase.

## Stack figée (ne pas changer sans justification explicite)

Godot 4.6 / GDScript · Nakama self-host (Docker) · PostgreSQL ·
runtime serveur **TypeScript** (Go réservé à un futur module CPU-bound isolé) ·
cible PC d'abord, Android (AAB) visé tôt.
