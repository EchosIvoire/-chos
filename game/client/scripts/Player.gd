extends Node2D
## Placeholder de personnage — Phase 0.
##
## Aucune logique de jeu ici : on valide seulement que la scene s'ouvre et
## qu'un perso s'affiche, dans l'esprit de la DA (cercle plein + outline sombre).
## Le vrai controller top-down (deplacement, camera de suivi, combat) arrive en
## Phase 1, dans un noeud CharacterBody2D dedie.

const RADIUS := 28.0
const FILL := Color("c8643c")      # terracotta — palette "Terres fauves"
const OUTLINE := Color("2b1d16")   # outline sombre, DA cartoon illustre
const OUTLINE_WIDTH := 4.0

func _ready() -> void:
	print("[Terres Fauves] Phase 0 — perso placeholder pret.")

func _draw() -> void:
	draw_circle(Vector2.ZERO, RADIUS, FILL)
	draw_arc(Vector2.ZERO, RADIUS, 0.0, TAU, 48, OUTLINE, OUTLINE_WIDTH, true)
