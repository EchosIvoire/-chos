# Terres Fauves

RPG 2D top-down (vue 3/4) multijoueur coopératif : combat/bashing, progression long
terme, **métiers & craft façon Dofus**, quêtes, co-op en instance, **arènes PvP**, et
**boutique de cosmétiques** (zéro pay-to-win).

> ℹ️ Ce dossier `game/` est un **pont temporaire** dans le repo `-chos` (qui héberge un
> site web). Il sera extrait vers un repo dédié `terres-fauves` via
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
→ Attendu : fenêtre 1152×648, fond sombre, **perso placeholder** (cercle terracotta).

## Docs
- `docs/ARCHITECTURE.md` — shards/instances, serveur autoritatif, netcode.
- `docs/DATA_SCHEMA.md` — données persistantes + cosmétiques/entitlements (anti-P2W).
- `docs/ART_DIRECTION.md` — direction "Terres Fauves".

## État : Phase 0 — Fondations
- [x] Projet Godot 4.6 (2D) + scène perso placeholder
- [x] docker-compose Nakama + Postgres
- [x] Squelette runtime serveur TypeScript (RPC `healthcheck`)
- [x] Arbo assets (`concept/` vs `sprites/`)
- [x] Schéma données + cosmétiques sur papier
- [ ] **Phase 1** — cœur du fun offline (déplacement, caméra, combat de base)
