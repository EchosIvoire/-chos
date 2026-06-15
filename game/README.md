# Aurendel

ARPG 2D top-down multijoueur dans l'univers de **L'Échine** : un monde qui est en
réalité le dos d'une bête colossale agonisante. Combat temps réel par **Voies**
(classes), co-op en instance, métiers/craft, **arènes PvP**, **boutique de
cosmétiques** (zéro pay-to-win), campagne narrative. Univers complet : `docs/GAME_BIBLE.md`.

> ℹ️ Ce dossier `game/` est un **pont temporaire** dans le repo `-chos` (qui héberge un
> site web). Il sera extrait vers un repo dédié `aurendel` via
> `git subtree split` une fois ce dernier créé — historique préservé.

## Stack
- **Client :** Godot 4.6 (2D, GDScript) — `client/`
- **Backend :** Nakama (serveur autoritatif) + PostgreSQL, self-host Docker — `server/`
- **Runtime serveur :** TypeScript — `server/runtime/`
- **Cible :** PC d'abord, Android (AAB) visé tôt.

## Lancer en local

### 1. Backend (Nakama + Postgres)
```bash
cd server
docker compose up        # API: 127.0.0.1:7350 — console admin: 127.0.0.1:7351
```
Nakama démarre même sans module serveur (DoD Phase 0).

### 2. (Optionnel) Builder la logique serveur TypeScript
```bash
cd server/runtime
npm install
npm run build            # génère ../nakama/data/modules/index.js
```
Puis relancer `docker compose up` : Nakama charge le module et expose le RPC `healthcheck`.

### 3. Client Godot
Ouvrir `client/` dans **Godot 4.6** et lancer (F5).
→ Attendu : zone greybox, perso terracotta jouable, 4 mobs factices.
- Déplacement : **ZQSD / WASD / flèches**
- Attaque (cône) : **clic gauche / J**
- Esquive (dash + i-frames) : **Espace**
- Compétence AoE : **K**

### 4. Tests (logique pure, sans Godot graphique)
```bash
cd client
godot --headless --path . -s res://tests/test_combat.gd   # code 0 = OK
```

## Docs
- `docs/GAME_BIBLE.md` — **univers & design L'Échine** (lore, Voies, trame, mécaniques).
- `docs/VISION.md` — vision consolidée : L'Échine × archi coop/économie + roadmap fusionnée.
- `docs/ARCHITECTURE.md` — shards/instances, serveur autoritatif, netcode, monde multi-biomes.
- `docs/DATA_SCHEMA.md` — données persistantes + cosmétiques/entitlements (anti-P2W).
- `docs/ART_DIRECTION.md` — direction artistique L'Échine.

## État
**Phase 0 — Fondations** ✅
- [x] Projet Godot 4.6 (2D) · docker-compose Nakama+Postgres · runtime TS (RPC `healthcheck`)
- [x] Arbo assets · schéma données + cosmétiques · DA "Aurendel" figée

**Phase 1 — Cœur du fun (offline)** ✅ *(à valider manette/clavier en main)*
- [x] Controller top-down 8 dir + accel/friction, caméra de suivi lissée
- [x] Combat : attaque en cône, esquive (dash + i-frames), 1 skill AoE
- [x] Game feel : knockback, hit-stop, screen shake, hit-flash, chiffres de dégâts, crits
- [x] Zone greybox + collisions + 4 mobs factices
- [x] Logique de combat pure isolée (`scripts/core/combat.gd`) + tests headless
- [x] Input via InputMap (rebindable, prêt tactile) — physique ZQSD/WASD

**Phase 2** — perso persistant + 1 skin + boutique factice *(prochaine)*
