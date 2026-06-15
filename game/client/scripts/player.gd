extends CharacterBody2D
## Controller du joueur — Phase 2 (offline, persistance locale).
##
## Hérite du cœur de combat Phase 1 (déplacement 8 dir, esquive/i-frames, attaque
## en cône, compétence, game feel) et ajoute : niveau/XP/stats persistants, jauge
## de SOUFFLE (ressource L'Échine), et application d'un SKIN cosmétique (visuel pur).
##
## Voie incarnée pour l'instant : le BRASIER (compétence = Tourbillon, AoE).
## Les stats viennent du NIVEAU (Progression) ; le skin ne touche jamais aux stats.

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

const SKILL_COOLDOWN := 2.5         # Tourbillon (Voie du Brasier)
const SKILL_POWER := 2.2
const SKILL_RADIUS := 140.0
const SKILL_SOUFFLE_COST := 40

const CRIT_CHANCE := 0.2
const CRIT_MULT := 1.6

const MAX_SOUFFLE := 100
const SOUFFLE_PER_HIT := 12

const OUTLINE := Color("2b1d16")

# --- Progression (persistée via l'autoload Save) ---
var level := 1
var xp := 0
var max_hp := 100
var atk := 12
var hp := 100
var souffle := 0
var max_souffle := MAX_SOUFFLE

# --- Couleurs du skin équipé (visuel pur, voir Cosmetics) ---
var _fill := Color("c8643c")
var _accent := Color("33b3a6")
var _trail := Color("f2c14e")

var _facing := Vector2.DOWN
var _dodge_timer := 0.0
var _dodge_cd := 0.0
var _attack_cd := 0.0
var _skill_cd := 0.0
var _invulnerable := false
var _swing := 0.0
var _skill_fx := 0.0
var _shake_amt := 0.0
var _stopping := false
var _hit_flash := 0.0
var _spawn_pos := Vector2.ZERO

@onready var camera: Camera2D = $Camera2D

func _ready() -> void:
	add_to_group("player")
	_spawn_pos = global_position
	# Charge la progression sauvegardée et en dérive les stats.
	level = int(Save.data.get("level", 1))
	xp = int(Save.data.get("xp", 0))
	max_hp = Progression.max_hp(level)
	atk = Progression.attack(level)
	hp = max_hp
	souffle = 0
	refresh_skin()

func _physics_process(delta: float) -> void:
	_tick_timers(delta)

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
	if _hit_flash > 0.0:
		_hit_flash = move_toward(_hit_flash, 0.0, delta * 4.0)
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
			_gain_souffle()
			hit_any = true
	if hit_any:
		_hit_feedback(1.2 if is_crit else 1.0)

func _skill() -> void:
	if souffle < SKILL_SOUFFLE_COST:
		return                       # pas assez de Souffle
	souffle -= SKILL_SOUFFLE_COST
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

func _gain_souffle() -> void:
	souffle = clampi(souffle + SOUFFLE_PER_HIT, 0, max_souffle)

# --- Progression ---

func gain_xp(amount: int) -> void:
	var r := Progression.add_xp(level, xp, amount)
	level = int(r["level"])
	xp = int(r["xp"])
	if int(r["leveled"]) > 0:
		_on_level_up()
	Save.data["level"] = level
	Save.data["xp"] = xp
	Save.save_game()

func _on_level_up() -> void:
	max_hp = Progression.max_hp(level)
	atk = Progression.attack(level)
	hp = max_hp            # soin complet à la montée de niveau
	_skill_fx = 1.0        # petit fx de feedback

# --- Cosmétique (visuel pur) ---

func refresh_skin() -> void:
	var s := Cosmetics.get_skin(String(Save.data.get("equipped_skin", Cosmetics.DEFAULT_SKIN)))
	_fill = Color(String(s["fill"]))
	_accent = Color(String(s["accent"]))
	_trail = Color(String(s["trail"]))
	queue_redraw()

# --- PV / dégâts subis ---

func take_damage(amount: int, from_dir: Vector2) -> void:
	if _invulnerable or _dodge_timer > 0.0:
		return     # i-frames de l'esquive
	hp = Combat.apply_damage(hp, amount, max_hp)
	_hit_flash = 1.0
	_shake_amt = maxf(_shake_amt, 6.0)
	velocity += from_dir.normalized() * 200.0
	queue_redraw()
	if Combat.is_dead(hp):
		_die()

func _die() -> void:
	hp = max_hp
	global_position = _spawn_pos
	velocity = Vector2.ZERO
	_hit_flash = 1.0

# --- Game feel ---

func _hit_feedback(strength: float) -> void:
	_shake_amt = maxf(_shake_amt, 5.0 * strength)
	_hitstop(0.05 * strength)

func _hitstop(duration: float) -> void:
	if _stopping:
		return
	_stopping = true
	Engine.time_scale = 0.05
	await get_tree().create_timer(duration, true, false, true).timeout
	Engine.time_scale = 1.0
	_stopping = false

# --- Rendu placeholder (greybox, couleurs = skin équipé) ---

func _draw() -> void:
	var alpha := 0.45 if _invulnerable else 1.0
	if _skill_fx > 0.0:
		draw_circle(Vector2.ZERO, SKILL_RADIUS * (1.0 - _skill_fx * 0.15), Color(_trail, 0.18 * _skill_fx))
		draw_arc(Vector2.ZERO, SKILL_RADIUS, 0.0, TAU, 48, Color(_trail, _skill_fx), 4.0, true)
	var body_col := Color(_fill, alpha).lerp(Color.WHITE, _hit_flash * 0.6)
	draw_circle(Vector2.ZERO, 22.0, body_col)
	draw_arc(Vector2.ZERO, 22.0, 0.0, TAU, 40, Color(OUTLINE, alpha), 4.0, true)
	draw_line(Vector2(-16, 6), Vector2(16, 6), Color(_accent, alpha), 5.0)
	var tip := _facing * 26.0
	draw_line(tip * 0.4, tip, Color(OUTLINE, alpha), 4.0)
	if _swing > 0.0:
		var base := _facing.angle()
		var half := ATTACK_ARC * 0.5
		draw_arc(Vector2.ZERO, ATTACK_RANGE, base - half, base + half, 24, Color(_trail, _swing), 6.0, true)
	# barre de vie du joueur (au-dessus de la tête)
	var w := 52.0
	var ratio := float(hp) / float(max_hp)
	draw_rect(Rect2(-w * 0.5, -42.0, w, 7.0), Color(OUTLINE, alpha))
	draw_rect(Rect2(-w * 0.5 + 1.0, -41.0, (w - 2.0) * ratio, 5.0), Color("6a8d4f"))
