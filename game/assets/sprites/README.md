# assets/sprites/

Sprites & tilesets **in-game** : style cartoon illustre (outline net, ombrage doux),
animations directionnelles, atlas optimises pour le renderer 2D de Godot.

Pipeline : concept (Higgsfield) -> generation locale (ComfyUI / Flux-class, RTX 4090)
-> **finition main**.

Convention de marquage :
- `__HAND__` dans le nom = asset a repasser/finir a la main (persos, skins vendus).
- Sous-dossiers par type : `chars/`, `tilesets/`, `fx/`, `ui/`, `skins/`.

Les **skins** sont penses comme couches reutilisables (sprite sheets / overlays /
variantes de palette) sur une silhouette de base partagee.
