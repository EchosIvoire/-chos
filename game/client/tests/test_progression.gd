extends SceneTree
## Tests de la progression PURE (niveau / XP / stats). Autoload non requis (preload).
##   godot --headless --path . -s res://tests/test_progression.gd

const P = preload("res://scripts/core/progression.gd")

func _initialize() -> void:
	var fails := 0
	fails += _chk("xp_to_next niv.1 = 50", P.xp_to_next(1) == 50)
	fails += _chk("xp_to_next niv.3 = 130", P.xp_to_next(3) == 130)

	var r1: Dictionary = P.add_xp(1, 0, 50)
	fails += _chk("50 xp -> niveau 2", r1["level"] == 2 and r1["xp"] == 0 and r1["leveled"] == 1)

	var r2: Dictionary = P.add_xp(1, 0, 30)
	fails += _chk("30 xp -> reste niveau 1", r2["level"] == 1 and r2["xp"] == 30)

	var r3: Dictionary = P.add_xp(1, 0, 1000)
	fails += _chk("gros xp -> multi level-up", r3["level"] > 3 and r3["leveled"] >= 3)

	fails += _chk("max_hp croit avec le niveau", P.max_hp(5) > P.max_hp(1))
	fails += _chk("attack croit avec le niveau", P.attack(5) > P.attack(1))
	fails += _chk("plafond MAX_LEVEL", P.add_xp(P.MAX_LEVEL, 0, 99999)["level"] == P.MAX_LEVEL)

	if fails == 0:
		print("[TEST] progression OK")
		quit(0)
	else:
		printerr("[TEST] progression ECHEC: %d" % fails)
		quit(1)

func _chk(label: String, cond: bool) -> int:
	if cond:
		print("  ok  ", label)
		return 0
	printerr("  KO  ", label)
	return 1
