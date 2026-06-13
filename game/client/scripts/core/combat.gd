class_name Combat
extends RefCounted
## Logique de combat PURE — aucune dépendance au rendu ni au réseau.
##
## Règle qualité du projet : la résolution de combat est isolée et déterministe,
## donc testable seule (voir res://tests/test_combat.gd). En Phase 3, le serveur
## autoritatif (Nakama) appliquera EXACTEMENT la même règle — c'est la source de
## vérité partagée, jamais le client.

## Dégâts d'un coup. Déterministe (le crit est décidé en amont par l'appelant).
## Mitigation douce par la défense : def=100 => -50% de dégâts.
static func compute_damage(attacker_atk: int, base_power: float, target_def: int, is_crit: bool, crit_mult: float = 1.5) -> int:
	var raw: float = float(attacker_atk) * base_power
	var mitigated: float = raw * (100.0 / (100.0 + float(maxi(target_def, 0))))
	if is_crit:
		mitigated *= crit_mult
	return int(maxf(1.0, roundf(mitigated)))

## Applique des dégâts à des PV, borné à [0, max_hp]. Retourne les nouveaux PV.
static func apply_damage(current_hp: int, damage: int, max_hp: int) -> int:
	return clampi(current_hp - maxi(damage, 0), 0, max_hp)

static func is_dead(hp: int) -> bool:
	return hp <= 0
