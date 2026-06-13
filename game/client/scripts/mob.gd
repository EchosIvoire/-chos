extends CharacterBody2D
## Mob factice ("training dummy") — Phase 1.
##
## Ne se déplace pas et ne riposte pas : son seul rôle est de valider le ressenti
## de frappe (encaisse, recule, clignote, affiche les dégâts, meurt avec un pop).
## L'IA réelle (aggro, patrouille, attaques) viendra plus tard, côté autoritatif.

const MAX_HP := 60
const RADIUS := 22.0
const BODY := Color("7a4a2e")
const OUTLINE := Color("2b1d16")
const EYE := Color("d1495b")

var hp := MAX_HP
var _knockback := Vector2.ZERO
var _flash := 0.0

func _ready() -> void:
	add_to_group("mobs")

func _physics_process(delta: float) -> void:
	_knockback = _knockback.move_toward(Vector2.ZERO, 1500.0 * delta)
	velocity = _knockback
	move_and_slide()
	if _flash > 0.0:
		_flash = move_toward(_flash, 0.0, delta * 5.0)
		queue_redraw()

func take_damage(amount: int, dir: Vector2, is_crit: bool) -> void:
	hp = Combat.apply_damage(hp, amount, MAX_HP)
	_knockback = dir.normalized() * 440.0
	_flash = 1.0
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
