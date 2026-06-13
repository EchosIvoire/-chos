extends CharacterBody2D
## Controller top-down — Phase 1 (offline).
##
## Périmètre minimal jouable : déplacement 8 directions, esquive (dash + i-frames),
## attaque mêlée en cône, 1 compétence AoE. Tout l'input passe par des actions
## (InputMap) => rebindable et prêt pour le tactile (joystick virtuel, Phase 8).
##
## Le game feel (knockback/hit-stop/shake/flash/chiffres) est l'enjeu n°1 de cette
## phase : si taper du mob n'est pas satisfaisant ici, on corrige avant tout le reste.

const SPEED := 240.0
const ACCEL := 2000.0
const FRICTION := 2200.0

const DODGE_SPEED := 620.0
const DODGE_TIME := 0.18
const DODGE_COOLDOWN := 0.6

const ATTACK_COOLDOWN := 0.35
const ATTACK_RANGE := 64.0
const ATTACK_ARC := deg_to_rad(110.0)
const ATTACK_POWER := 1.0

const SKILL_COOLDOWN := 2.5
const SKILL_POWER := 2.2
const SKILL_RADIUS := 140.0

const CRIT_CHANCE := 0.2
const CRIT_MULT := 1.6

@export var atk: int = 12

# Couleurs DA "Aurendel".
const FILL := Color("c8643c")
const OUTLINE := Color("2b1d16")
const ACCENT := Color("33b3a6")
const HAIR := Color("2b1d16")

var _facing := Vector2.DOWN
var _dodge_timer := 0.0
var _dodge_cd := 0.0
var _attack_cd := 0.0
var _skill_cd := 0.0
var _invulnerable := false
var _swing := 0.0          # avancement de l'anim de coup (1 -> 0)
var _skill_fx := 0.0       # avancement du flash de skill (1 -> 0)
var _shake_amt := 0.0
var _stopping := false     # garde-fou contre les hit-stops imbriqués

@onready var camera: Camera2D = $Camera2D

func _physics_process(delta: float) -> void:
	_tick_timers(delta)

	# Pendant l'esquive, on conserve l'élan du dash (i-frames actives).
	if _dodge_timer > 0.0:
		move_and_slide()
		return

	var input := Input.get_vector("move_left", "move_right", "move_up", "move_down")
	if input != Vector2.ZERO:
		_facing = input.normalized()
		velocity = velocity.move_toward(input * SPEED, ACCEL * delta)
	else:
		velocity = velocity.move_toward(Vector2.ZERO, FRICTION * delta)

	if Input.is_action_just_pressed("dodge") and _dodge_cd <= 0.0:
		_start_dodge()
	elif Input.is_action_just_pressed("attack") and _attack_cd <= 0.0:
		_attack()
	elif Input.is_action_just_pressed("skill_1") and _skill_cd <= 0.0:
		_skill()

	move_and_slide()
	queue_redraw()

func _process(delta: float) -> void:
	# Screen shake : décroissance + offset aléatoire appliqué à la caméra.
	if _shake_amt > 0.05:
		camera.offset = Vector2(randf_range(-_shake_amt, _shake_amt), randf_range(-_shake_amt, _shake_amt))
		_shake_amt = move_toward(_shake_amt, 0.0, 40.0 * delta)
	else:
		camera.offset = Vector2.ZERO
	if _swing > 0.0:
		_swing = move_toward(_swing, 0.0, delta / 0.18)
		queue_redraw()
	if _skill_fx > 0.0:
		_skill_fx = move_toward(_skill_fx, 0.0, delta / 0.3)
		queue_redraw()

func _tick_timers(delta: float) -> void:
	_dodge_cd = maxf(0.0, _dodge_cd - delta)
	_attack_cd = maxf(0.0, _attack_cd - delta)
	_skill_cd = maxf(0.0, _skill_cd - delta)
	if _dodge_timer > 0.0:
		_dodge_timer = maxf(0.0, _dodge_timer - delta)
		if _dodge_timer == 0.0:
			_invulnerable = false

func _start_dodge() -> void:
	var dir := _facing if _facing != Vector2.ZERO else Vector2.DOWN
	velocity = dir * DODGE_SPEED
	_dodge_timer = DODGE_TIME
	_dodge_cd = DODGE_COOLDOWN
	_invulnerable = true
	queue_redraw()

func _attack() -> void:
	_attack_cd = ATTACK_COOLDOWN
	_swing = 1.0
	var is_crit := randf() < CRIT_CHANCE
	var dmg := Combat.compute_damage(atk, ATTACK_POWER, 0, is_crit, CRIT_MULT)
	var hit_any := false
	for m in get_tree().get_nodes_in_group("mobs"):
		if not is_instance_valid(m):
			continue
		var to_m: Vector2 = m.global_position - global_position
		if to_m.length() <= ATTACK_RANGE + 22.0 and absf(_facing.angle_to(to_m)) <= ATTACK_ARC * 0.5:
			m.take_damage(dmg, to_m.normalized(), is_crit)
			hit_any = true
	if hit_any:
		_hit_feedback(1.2 if is_crit else 1.0)

func _skill() -> void:
	_skill_cd = SKILL_COOLDOWN
	_skill_fx = 1.0
	var hit_any := false
	for m in get_tree().get_nodes_in_group("mobs"):
		if not is_instance_valid(m):
			continue
		var to_m: Vector2 = m.global_position - global_position
		if to_m.length() <= SKILL_RADIUS + 22.0:
			var dmg := Combat.compute_damage(atk, SKILL_POWER, 0, false)
			m.take_damage(dmg, to_m.normalized(), false)
			hit_any = true
	_hit_feedback(2.0 if hit_any else 1.0)

# --- Game feel ---

func _hit_feedback(strength: float) -> void:
	_shake_amt = maxf(_shake_amt, 5.0 * strength)
	_hitstop(0.05 * strength)

func _hitstop(duration: float) -> void:
	if _stopping:
		return
	_stopping = true
	Engine.time_scale = 0.05
	# ignore_time_scale = true => le timer s'écoule en temps réel malgré le ralenti.
	await get_tree().create_timer(duration, true, false, true).timeout
	Engine.time_scale = 1.0
	_stopping = false

# --- Rendu placeholder (DA "Aurendel") ---

func _draw() -> void:
	var alpha := 0.45 if _invulnerable else 1.0
	# zone de skill
	if _skill_fx > 0.0:
		draw_circle(Vector2.ZERO, SKILL_RADIUS * (1.0 - _skill_fx * 0.15), Color(ACCENT, 0.18 * _skill_fx))
		draw_arc(Vector2.ZERO, SKILL_RADIUS, 0.0, TAU, 48, Color(ACCENT, _skill_fx), 4.0, true)
	# corps
	draw_circle(Vector2.ZERO, 22.0, Color(FILL, alpha))
	draw_arc(Vector2.ZERO, 22.0, 0.0, TAU, 40, Color(OUTLINE, alpha), 4.0, true)
	# ceinture-accent (repère DA)
	draw_line(Vector2(-16, 6), Vector2(16, 6), Color(ACCENT, alpha), 5.0)
	# indicateur de direction
	var tip := _facing * 26.0
	draw_line(tip * 0.4, tip, Color(OUTLINE, alpha), 4.0)
	# arc de coup
	if _swing > 0.0:
		var base := _facing.angle()
		var half := ATTACK_ARC * 0.5
		draw_arc(Vector2.ZERO, ATTACK_RANGE, base - half, base + half, 24, Color("f2c14e", _swing), 6.0, true)
