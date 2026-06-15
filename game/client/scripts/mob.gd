extends CharacterBody2D
## Mob — Phase 1.5 : IA minimale (aggro -> poursuite -> attaque télégraphée).
##
## Volontairement basique (pas de pathfinding, pas de variété) : juste assez pour
## que le combat se JUGE — esquiver sert enfin à quelque chose, le placement compte.
## L'IA riche (et autoritative) viendra côté serveur plus tard.

const MAX_HP := 60
const RADIUS := 22.0

const AGGRO_RADIUS := 340.0
const MOVE_SPEED := 115.0
const ATTACK_RANGE := 42.0
const TELEGRAPH := 0.45        # durée du windup visible avant le coup
const ATTACK_DAMAGE := 8
const ATTACK_COOLDOWN := 1.1
const STUN_TIME := 0.18        # immobilisation à la réception d'un coup

const BODY := Color("7a4a2e")
const OUTLINE := Color("2b1d16")
const EYE := Color("d1495b")
const DANGER := Color("d1495b")

var hp := MAX_HP
var _knockback := Vector2.ZERO
var _flash := 0.0
var _stun := 0.0
var _atk_cd := 0.0
var _windup := 0.0
var _player: Node2D

func _ready() -> void:
	add_to_group("mobs")
	_player = get_tree().get_first_node_in_group("player")

func _physics_process(delta: float) -> void:
	_flash = move_toward(_flash, 0.0, delta * 5.0)
	_atk_cd = maxf(0.0, _atk_cd - delta)
	_knockback = _knockback.move_toward(Vector2.ZERO, 1500.0 * delta)

	# Sonné : on subit juste le recul.
	if _stun > 0.0:
		_stun = maxf(0.0, _stun - delta)
		velocity = _knockback
		move_and_slide()
		queue_redraw()
		return

	if not is_instance_valid(_player):
		_player = get_tree().get_first_node_in_group("player")
	var to_player := Vector2.ZERO
	var dist := INF
	if is_instance_valid(_player):
		to_player = _player.global_position - global_position
		dist = to_player.length()

	# Windup : immobile (sauf recul), puis frappe.
	if _windup > 0.0:
		_windup = maxf(0.0, _windup - delta)
		velocity = _knockback
		if _windup == 0.0:
			_strike(to_player)
		move_and_slide()
		queue_redraw()
		return

	if dist <= ATTACK_RANGE and _atk_cd <= 0.0:
		_windup = TELEGRAPH
		velocity = _knockback
	elif dist <= AGGRO_RADIUS:
		velocity = to_player.normalized() * MOVE_SPEED + _knockback
	else:
		velocity = _knockback

	move_and_slide()
	queue_redraw()

func _strike(to_player: Vector2) -> void:
	_atk_cd = ATTACK_COOLDOWN
	# Le coup ne touche que si le joueur est ENCORE à portée (donc esquivable).
	if is_instance_valid(_player) and to_player.length() <= ATTACK_RANGE + 14.0:
		if _player.has_method("take_damage"):
			_player.take_damage(ATTACK_DAMAGE, to_player.normalized())

func take_damage(amount: int, dir: Vector2, is_crit: bool) -> void:
	hp = Combat.apply_damage(hp, amount, MAX_HP)
	_knockback = dir.normalized() * 440.0
	_flash = 1.0
	_stun = STUN_TIME
	_windup = 0.0  # se faire toucher interrompt la télégraphie
	_spawn_damage_number(amount, is_crit)
	queue_redraw()
	if Combat.is_dead(hp):
		_die()

func _die() -> void:
	remove_from_group("mobs")
	set_physics_process(false)
	$CollisionShape2D.set_deferred("disabled", true)
	var t := create_tween()
	t.set_parallel(true)
	t.tween_property(self, "scale", Vector2(1.3, 0.6), 0.12)
	t.tween_property(self, "modulate:a", 0.0, 0.12)
	t.chain().tween_callback(queue_free)

func _spawn_damage_number(amount: int, is_crit: bool) -> void:
	var lbl := Label.new()
	lbl.text = str(amount) + ("!" if is_crit else "")
	lbl.add_theme_font_size_override("font_size", 26 if is_crit else 20)
	lbl.add_theme_color_override("font_color", Color("d1495b") if is_crit else Color("f2c14e"))
	lbl.add_theme_color_override("font_outline_color", Color("2b1d16"))
	lbl.add_theme_constant_override("outline_size", 4)
	lbl.z_index = 100
	lbl.global_position = global_position + Vector2(-10, -RADIUS - 14)
	get_parent().add_child(lbl)
	var t := lbl.create_tween()
	t.set_parallel(true)
	t.tween_property(lbl, "global_position:y", lbl.global_position.y - 36.0, 0.55)
	t.tween_property(lbl, "modulate:a", 0.0, 0.55).set_delay(0.1)
	t.chain().tween_callback(lbl.queue_free)

func _draw() -> void:
	var col := BODY.lerp(Color.WHITE, _flash * 0.7)
	# Télégraphie : le mob rougit + un anneau de menace grandit.
	if _windup > 0.0:
		var progress := 1.0 - _windup / TELEGRAPH
		col = col.lerp(DANGER, 0.55)
		draw_arc(Vector2.ZERO, ATTACK_RANGE * (0.55 + 0.45 * progress), 0.0, TAU, 32, Color(DANGER, 0.85), 3.0, true)
	draw_circle(Vector2.ZERO, RADIUS, col)
	draw_arc(Vector2.ZERO, RADIUS, 0.0, TAU, 36, OUTLINE, 4.0, true)
	draw_circle(Vector2(-8, -4), 3.5, EYE)
	draw_circle(Vector2(8, -4), 3.5, EYE)
	# barre de vie
	var w := 44.0
	var ratio := float(hp) / float(MAX_HP)
	var top := -RADIUS - 14.0
	draw_rect(Rect2(-w * 0.5, top, w, 6.0), Color("2b1d16"))
	draw_rect(Rect2(-w * 0.5 + 1.0, top + 1.0, (w - 2.0) * ratio, 4.0), Color("d1495b"))
