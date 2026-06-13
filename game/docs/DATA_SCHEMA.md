# Données persistantes & système de cosmétiques (Phase 0 — sur papier)

Stockage via **Nakama Storage** (collections JSON par utilisateur) adossé à
PostgreSQL. **Le client ne possède aucune autorité.** Toute écriture sensible
passe par le runtime serveur (`server/runtime`).

## Collections (clé = user_id sauf indiqué)

### `account`
```
display_name, created_at, last_login
```

### `character` — l'avatar jouable
```
level, xp, xp_to_next
stats_base { hp, atk, def, crit, ... }   # dérivées du level — JAMAIS du cosmétique
skill_points, skill_tree { node_id: rank }
equipped_cosmetics { skin: id|null, pet: id|null, trail: id|null }  # purement visuel
```

### `inventory` — items fonctionnels (ressources, consommables, équipement de stats)
```
items [ { item_id, qty, instance_data? } ]
capacity
```

### `professions` — métiers façon Dofus
```
{ prof_id: { level, xp, xp_to_next } }   # ex : mineur, herboriste, forgeron
```

### `entitlements` — droits cosmétiques possédés ⚠️ **écriture SERVEUR exclusive**
```
owned_cosmetics [ cosmetic_id, ... ]
source { cosmetic_id: "shop"|"reward"|"founder" }
granted_at
```

### `quests`
```
active   [ { quest_id, step, counters } ]
completed[ quest_id ]
```

### `wallet`
```
hard_currency   # achetée (boutique)
soft_currency   # gagnée en jeu — jamais convertible en cosmétique (anti-P2W)
```

## Garantie anti-pay-to-win (structurelle, pas une promesse)

1. `entitlements` : **write ACL = no client write** (Nakama PermissionWrite=0).
   Le client lit ce qu'il possède, ne peut jamais s'auto-attribuer un skin.
2. RPC serveur `equip_cosmetic` : on ne peut équiper qu'un id présent dans
   `entitlements.owned_cosmetics`.
3. **Aucun cosmétique ne touche `stats_base` ni `skill_tree`.**
   - Chemin RENDU : lit `equipped_cosmetics` (apparence).
   - Chemin SIMULATION : lit `stats_base` (combat).
   Deux chemins disjoints → impossible by design qu'un skin influe sur le gameplay.

## Données de CONTENU (statiques, versionnées dans le repo — pas par joueur)

`item_defs`, `cosmetic_defs`, `recipe_defs`, `mob_defs`, `quest_defs`,
`skill_tree_def`. Partagées client + serveur ; **source de vérité = serveur**.
Le client les utilise pour l'affichage/prédiction, jamais pour décider d'un résultat.
