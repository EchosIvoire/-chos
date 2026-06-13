# Architecture — Terres Fauves

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

## Risque majeur tracké : la POPULATION

Arène PvP "peuplée" et économie de skins ne valent rien sans joueurs.
→ Chaque système multijoueur doit **rester fun à 1–2 joueurs** (remplissage IA /
bots PvP) sinon les phases 5–6 sortent dans le vide. À réévaluer à chaque phase.

## Stack figée (ne pas changer sans justification explicite)

Godot 4.6 / GDScript · Nakama self-host (Docker) · PostgreSQL ·
runtime serveur **TypeScript** (Go réservé à un futur module CPU-bound isolé) ·
cible PC d'abord, Android (AAB) visé tôt.
