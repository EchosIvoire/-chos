class_name Cosmetics
extends RefCounted
## Définitions cosmétiques (contenu statique). 100% VISUEL — aucun impact stat.
## En attendant les vrais sprites, un skin = un jeu de couleurs appliqué au rendu
## greybox (corps / accent / traînée de Voie). Plus tard : sprite-sheets / overlays.
##
## L'équipement d'un skin est validé contre les droits possédés (entitlements) :
## en Phase 2 c'est local (SaveManager), en Phase 6 c'est vérifié serveur.

const DEFAULT_SKIN := "brasier_base"

const SKINS := {
	"brasier_base": {
		"name": "Brasier",
		"fill": "c8643c", "accent": "f2c14e", "trail": "ef6c3a",
	},
	"cendre_pale": {
		"name": "Cendre pâle",
		"fill": "9aa3ad", "accent": "33b3a6", "trail": "bfe9e3",
	},
}

static func exists(id: String) -> bool:
	return SKINS.has(id)

static func get_skin(id: String) -> Dictionary:
	return SKINS.get(id, SKINS[DEFAULT_SKIN])
