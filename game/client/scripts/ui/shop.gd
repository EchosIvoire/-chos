extends Control
## Boutique factice (Phase 2) — valide TÔT le pipeline cosmétique (modèle éco).
##
## Ouvre/ferme avec l'action "shop" (touche B), met le jeu en pause.
## Liste les skins, montre possédé/équipé, permet d'« acheter » (gratuit ici) puis
## d'équiper. Tout passe par l'autoload Save (droits + skin équipé), comme le fera
## plus tard le serveur autoritatif (Phase 6). Les skins sont 100% visuels.

var _panel: Panel
var _list: VBoxContainer
var _open := false

func _ready() -> void:
	set_anchors_preset(Control.PRESET_FULL_RECT)
	mouse_filter = Control.MOUSE_FILTER_IGNORE
	process_mode = Node.PROCESS_MODE_ALWAYS    # reste actif quand le jeu est en pause
	visible = false
	_build()

func _build() -> void:
	_panel = Panel.new()
	_panel.size = Vector2(400, 320)
	_panel.position = Vector2(376, 120)
	_panel.mouse_filter = Control.MOUSE_FILTER_STOP
	add_child(_panel)

	var title := Label.new()
	title.text = "BOUTIQUE — Cosmétiques (zéro pay-to-win)"
	title.position = Vector2(16, 12)
	_panel.add_child(title)

	_list = VBoxContainer.new()
	_list.position = Vector2(16, 48)
	_list.custom_minimum_size = Vector2(368, 240)
	_panel.add_child(_list)

	var hint := Label.new()
	hint.text = "B pour fermer"
	hint.position = Vector2(16, 292)
	hint.modulate = Color(1, 1, 1, 0.6)
	_panel.add_child(hint)

func _unhandled_input(event: InputEvent) -> void:
	if event.is_action_pressed("shop"):
		_toggle()
		get_viewport().set_input_as_handled()

func _toggle() -> void:
	_open = not _open
	visible = _open
	get_tree().paused = _open
	if _open:
		_refresh()

func _refresh() -> void:
	for c in _list.get_children():
		c.queue_free()
	for id in Cosmetics.SKINS.keys():
		var s: Dictionary = Cosmetics.SKINS[id]
		var owned: bool = Save.data["owned_cosmetics"].has(id)
		var equipped: bool = String(Save.data.get("equipped_skin", "")) == id
		var b := Button.new()
		var status := "ÉQUIPÉ" if equipped else ("Équiper" if owned else "Acheter (gratuit)")
		b.text = "%s — %s" % [String(s["name"]), status]
		b.disabled = equipped
		b.pressed.connect(_on_pick.bind(String(id)))
		_list.add_child(b)

func _on_pick(id: String) -> void:
	Save.grant(id)        # « achat » (gratuit en factice) -> droit acquis
	Save.equip(id)        # équipe (vérifie la possession)
	var p := get_tree().get_first_node_in_group("player")
	if is_instance_valid(p) and p.has_method("refresh_skin"):
		p.refresh_skin()
	_refresh()
