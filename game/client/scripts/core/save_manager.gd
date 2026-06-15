extends Node
## Sauvegarde LOCALE (Phase 2) — autoload "Save".
##
## Phase 2 : la sauvegarde locale est la source de vérité (jeu jouable sans serveur).
## Phase 3+ : Nakama devient autoritatif ; ce manager deviendra un cache local
## synchronisé avec le serveur. Garder l'API stable (get/grant/equip) pour limiter
## l'impact de cette bascule.

const PATH := "user://save.json"

var data := {
	"level": 1,
	"xp": 0,
	"owned_cosmetics": ["brasier_base"],   # le skin de base est acquis d'office
	"equipped_skin": "brasier_base",
}

func _ready() -> void:
	load_game()

func load_game() -> void:
	if not FileAccess.file_exists(PATH):
		save_game()
		return
	var f := FileAccess.open(PATH, FileAccess.READ)
	if f == null:
		return
	var parsed: Variant = JSON.parse_string(f.get_as_text())
	if typeof(parsed) == TYPE_DICTIONARY:
		for k in data.keys():
			if parsed.has(k):
				data[k] = parsed[k]

func save_game() -> void:
	var f := FileAccess.open(PATH, FileAccess.WRITE)
	if f == null:
		push_warning("[Save] écriture impossible: %s" % PATH)
		return
	f.store_string(JSON.stringify(data, "  "))

## Octroie un droit cosmétique (en Phase 6 : appel serveur autoritatif).
func grant(skin_id: String) -> void:
	if not data["owned_cosmetics"].has(skin_id):
		data["owned_cosmetics"].append(skin_id)
		save_game()

## Équipe un skin SEULEMENT s'il est possédé. Retourne true si appliqué.
func equip(skin_id: String) -> bool:
	if data["owned_cosmetics"].has(skin_id):
		data["equipped_skin"] = skin_id
		save_game()
		return true
	return false
