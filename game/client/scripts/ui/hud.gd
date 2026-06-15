extends Control
## HUD écran (Phase 2) : niveau, PV, Souffle, XP. Lit le joueur chaque frame.
## Greybox volontaire (barres simples) — l'habillage UI viendra avec la DA.

var _p: Node
var _lvl: Label
var _hp: ProgressBar
var _souffle: ProgressBar
var _xp: ProgressBar

func _ready() -> void:
	mouse_filter = Control.MOUSE_FILTER_IGNORE   # ne capte pas les clics (sinon bloque l'attaque)
	_lvl = Label.new()
	_lvl.position = Vector2(16, 104)
	add_child(_lvl)
	_hp = _make_bar(Vector2(16, 128), 220, 18, Color("d1495b"))
	_souffle = _make_bar(Vector2(16, 150), 220, 12, Color("33b3a6"))
	_xp = _make_bar(Vector2(16, 168), 220, 8, Color("f2c14e"))

func _make_bar(pos: Vector2, w: float, h: float, col: Color) -> ProgressBar:
	var b := ProgressBar.new()
	b.position = pos
	b.custom_minimum_size = Vector2(w, h)
	b.size = Vector2(w, h)
	b.show_percentage = false
	b.min_value = 0.0
	b.max_value = 1.0
	b.value = 1.0
	var fill := StyleBoxFlat.new()
	fill.bg_color = col
	b.add_theme_stylebox_override("fill", fill)
	var bg := StyleBoxFlat.new()
	bg.bg_color = Color("2b1d16")
	b.add_theme_stylebox_override("background", bg)
	add_child(b)
	return b

func _process(_delta: float) -> void:
	if not is_instance_valid(_p):
		_p = get_tree().get_first_node_in_group("player")
		return
	_lvl.text = "Niveau %d   ·   PV %d/%d" % [_p.level, _p.hp, _p.max_hp]
	_hp.value = float(_p.hp) / float(maxi(_p.max_hp, 1))
	_souffle.value = float(_p.souffle) / float(maxi(_p.max_souffle, 1))
	_xp.value = float(_p.xp) / float(maxi(Progression.xp_to_next(_p.level), 1))
