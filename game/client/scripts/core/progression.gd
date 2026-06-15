class_name Progression
extends RefCounted
## Progression PURE & déterministe (niveau / XP / stats dérivées).
## Aucune dépendance rendu/réseau → testable seule. En Phase 3, c'est cette règle
## que le serveur autoritatif appliquera (jamais le client).
##
## Les stats sont dérivées du NIVEAU uniquement — jamais d'un cosmétique (anti-P2W).

const MAX_LEVEL := 30

## XP nécessaire pour passer DE `level` à `level+1`.
static func xp_to_next(level: int) -> int:
	return 50 + (maxi(level, 1) - 1) * 40   # 50, 90, 130, 170, ...

## Absorbe `gained` XP. Retourne { level, xp, leveled } (leveled = nb de niveaux gagnés).
static func add_xp(level: int, xp: int, gained: int) -> Dictionary:
	var lvl := maxi(level, 1)
	var cur := xp + maxi(gained, 0)
	var leveled := 0
	while lvl < MAX_LEVEL and cur >= xp_to_next(lvl):
		cur -= xp_to_next(lvl)
		lvl += 1
		leveled += 1
	if lvl >= MAX_LEVEL:
		cur = 0
	return {"level": lvl, "xp": cur, "leveled": leveled}

static func max_hp(level: int) -> int:
	return 80 + (maxi(level, 1) - 1) * 20

static func attack(level: int) -> int:
	return 10 + (maxi(level, 1) - 1) * 2
