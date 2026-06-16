# Prompts de génération d'assets — ComfyUI / Flux (DA L'Échine)

Prompts **prêts à copier-coller** pour générer les assets sur ta RTX 4090.
Écrits en anglais (les modèles Flux/SDXL répondent mieux en anglais).
Rappel pipeline : génération → **finition main** → import jeu (marquer `__HAND__`).

---

## Comment s'en servir (réglages conseillés)

- **Modèle** : Flux.1-dev (excellent en illustration), ou SDXL + LoRA cartoon/illustration.
- **Résolution** : 1024×1024 pour concepts/persos ; scènes en 1344×768 (paysage).
  Génère **grand** puis réduis pour les sprites (plus net).
- **Réglages** : Flux ~25-30 steps, guidance ~3.5 · SDXL ~30 steps, CFG 5-7.
- **Négatif commun** (SDXL ; Flux ignore mais garde-le si LoRA) :
  `pixel art, photorealistic, 3d render, blurry, text, watermark, harsh lighting, oversaturated neon, low contrast`
- **Sprites jouables** : génère sur **fond uni neutre** (gris/vert plat) + lumière
  douce et homogène → découpe propre ensuite (node `rembg` / SAM dans ComfyUI pour
  la transparence). Silhouette lisible **en petit** (teste à 48px).
- **⚠️ Top-down** : le vrai top-down vertical sort mal. Demande plutôt une
  **« top-down 3/4 RPG perspective, slight high angle »** (comme ta réf cozy) — ça
  marche beaucoup mieux et c'est exactement notre vue.
- **Cohérence d'un perso** (8 directions / variantes) : génère **une** image forte,
  puis sers-t'en comme **référence** (IPAdapter / Flux Redux / img2img faible
  denoise) pour produire les autres angles sans casser le style.

---

## 1 — Héros : l'Écoutant (concept / key art perso)

```
character concept art of "the Listener", a young humble wandering hero from a world
that is secretly the back of a colossal living beast. worn traveler's clothes in warm
ochre and terracotta, a cloth hood/wrap, a discreet faint glowing mark at the temples,
one hand raised toward the ear as if hearing a distant heartbeat. heroic yet gentle,
expressive face. full body, front view, neutral grey studio background, soft rim light.
2D hand-painted cartoon game art, clean soft outlines, soft cel shading, painterly
textures, cozy stylized fantasy, warm luminous palette with cool teal magic accents,
high readability, no pixel art, no photorealism, no 3d render
```

## 2 — Héros : sprite jouable (vue de jeu)

```
top-down 3/4 RPG game character sprite of the Listener hero, slight high angle like a
classic top-down action RPG (Moonlighter / Zelda-like), full body, idle pose facing
down toward the camera, centered, plain flat neutral background for easy cutout, even
soft lighting, crisp readable silhouette, warm ochre and terracotta outfit, teal accent,
discreet temple mark. 2D hand-painted cartoon game art, clean soft outlines, soft cel
shading, painterly textures, no pixel art, no photorealism, no 3d render
```
*(Génère aussi les poses : `walking`, `attacking`, `casting`, et les directions
`facing up / facing side` en réutilisant cette image en référence.)*

## 3 — Région de départ : environnement de surface

```
top-down 3/4 view of a lush stylized fantasy region, starting area of an action RPG:
warm grassy plateaus, rounded painterly trees, mossy boulders, a small wooden bridge
over a teal stream, scattered flowers and mushrooms, golden ambient light. subtle
unsettling detail: a few cliff faces are too smooth like giant scales, distant hills
aligned like a spine beneath the grass. cozy and inviting yet faintly alive. 2D
hand-painted cartoon game art, clean soft outlines, soft cel shading, painterly
textures, warm luminous palette, no pixel art, no photorealism, no 3d render
```
*(Pour un vrai **tileset** : demande des tuiles de terrain top-down séparées —
`seamless top-down grass / dirt path / cliff edge / water tiles, tileable, flat lighting`
— ou découpe les éléments de la scène ci-dessus à la main.)*

## 4 — Ennemi de surface

```
top-down 3/4 game sprite of a small hostile beast roaming the surface, hyena-like
predator with warm brown fur, glowing red eyes, bristled back, readable menacing
silhouette, full body, plain flat neutral background, even lighting. 2D hand-painted
cartoon game art, clean soft outlines, soft cel shading, painterly textures, no pixel
art, no photorealism, no 3d render
```

## 5 — Les Saigneurs (technologie ennemie, industriel-organique)

```
concept art of a "Bleeder" drilling machine: industrial-organic aesthetic, cold
vermilion metal rig grafted onto warm living flesh, glowing golden-red marrow fluid
inside glass tubes, ominous but beautiful, strong contrast between cold technology and
warm organic tissue. 2D hand-painted cartoon game art, clean soft outlines, soft cel
shading, painterly textures, no pixel art, no photorealism, no 3d render
```

## 6 — Key art / image-icône (l'horizon aux Bêtes-Mondes)

```
epic painterly key art: a lone small hero silhouette stands on a vast grassy ridge at
dusk, one hand raised to the ear, gazing at a starless sky where enormous distant
silhouettes of colossal beast-creatures slowly drift through the void on the horizon.
awe and melancholy, warm glowing foreground, deep teal and indigo sky, the world subtly
revealed as the back of a giant living beast. cinematic, atmospheric. 2D hand-painted
cartoon illustration, soft outlines, painterly, no pixel art, no photorealism
```

## 7 — Les Profondes (intérieur vivant, Acte III) — pour plus tard

```
top-down 3/4 view of the living interior of a colossal beast (the Depths): pearlescent
flesh walls, glowing blue bioluminescent nerves, rivers of incandescent golden-red
marrow, beautiful and unsettling, dramatic warm-cool contrast, eerie soft glow. 2D
hand-painted cartoon game art, clean soft outlines, soft cel shading, painterly
textures, no pixel art, no photorealism, no 3d render
```

---

## De l'image au jeu

Quand tu as un PNG qui te plaît (perso de préférence, fond transparent), **dépose-le
et préviens-moi** : je transforme le rendu greybox en **sprites** (Sprite2D /
AnimatedSprite2D) avec un emplacement clair par asset, et le système de skin
basculera de « swap de couleurs » à « swap de textures ». Tu verras enfin ton perso,
pas un rond.

Dossiers cibles (cf. `assets/sprites/`) : `chars/`, `tilesets/`, `fx/`, `ui/`, `skins/`.
