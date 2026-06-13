extends SceneTree
## Tests de la logique de combat PURE (sans rendu ni réseau).
##
## Lancer (depuis game/client/) :
##   godot --headless --path . -s res://tests/test_combat.gd
## Code de sortie 0 si tout passe, 1 sinon (exploitable en CI).

# preload direct => ne dépend pas du cache de classes globales (checkout neuf / CI).
const C = preload("res://scripts/core/combat.gd")

func _initialize() -> void:
	var failures := 0
	failures += _check("degats de base (atk*power)", C.compute_damage(10, 1.0, 0, false) == 10)
	failures += _check("mitigation def=100 => -50%", C.compute_damage(100, 1.0, 100, false) == 50)
	failures += _check("crit x1.6", C.compute_damage(10, 1.0, 0, true, 1.6) == 16)
	failures += _check("plancher a 1 degat", C.compute_damage(1, 0.01, 9999, false) >= 1)
	failures += _check("def negative ignoree", C.compute_damage(10, 1.0, -50, false) == 10)
	failures += _check("apply borne a 0", C.apply_damage(5, 999, 100) == 0)
	failures += _check("apply degats normaux", C.apply_damage(60, 16, 60) == 44)
	failures += _check("is_dead a 0", C.is_dead(0))
	failures += _check("vivant > 0", not C.is_dead(1))

	if failures == 0:
		print("[TEST] OK — tous les cas passent.")
		quit(0)
	else:
		printerr("[TEST] ECHEC — %d cas en erreur." % failures)
		quit(1)

func _check(label: String, condition: bool) -> int:
	if condition:
		print("  ok  ", label)
		return 0
	printerr("  KO  ", label)
	return 1
