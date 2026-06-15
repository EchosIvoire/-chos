# Direction Artistique — L'Échine ✅ (maj 2026-06-15)

> Remplace l'ancienne piste « savane ouest-africaine » (figée puis abandonnée au
> pivot L'Échine). Détails narratifs : `GAME_BIBLE.md` (Partie VIII).

## Technique (inchangée — validée par la réf du joueur)
Cartoon **peint**, illustré : **outline net + ombrage doux**, lisible en petit
(contrainte mobile). Pas de pixel, pas de photoréalisme. Feuillage/décor dense en
couches, ombres portées douces, rendu chaleureux.

## Signature absolue : LA PULSATION
Tout bat lentement — lumière, brume, sol qui se soulève et retombe comme un flanc
qui respire. **À animer partout** (shaders/tweens lents). C'est l'ADN visuel.

## Les indices de la chair (le monde est une bête)
En surface, des anomalies organiques troublantes : falaise trop lisse comme une
écaille, monts alignés comme des vertèbres, peau devinée sous la terre. Discret en
zones de départ, de plus en plus assumé en descendant.

## Deux palettes

**Surface** — naturelle, chaude, lumineuse, parsemée d'anomalies organiques.
- Terres chaudes (ocre, terre, or), verts de fourrure-forêt, ciel en lueur diffuse.
- Outline sombre commun. Accents froids réservés au feedback de compétence/Souffle.

**Les Profondes (Acte III)** — beau et inquiétant.
- Rouge-or de la **Moelle** incandescente, chair nacrée, nerfs bleus bioluminescents.
- Rupture de ton voulue par rapport à la surface.

**Les Saigneurs** — esthétique **industrielle-organique** : forages en métal vermeil,
tubes de Moelle, le froid de la technique greffé sur la chair chaude.

## Personnage — l'Écoutant (toi)
- Top-down 3/4, 8 directions, animations sobres (idle/walk/attack/dodge/hit/death).
- **Geste-signature** : la main qui monte vers l'oreille quand le grondement
  s'intensifie. Marque discrète aux tempes.
- **Principal poste d'effort art** : greybox d'abord, anim propre une fois la
  silhouette validée.

## Lisibilité combat — les traînées de Voie
Chaque Voie a sa signature visuelle, lisible d'un coup d'œil :
- Pierre → poussière ocre · Brasier → braises · Silence → volutes d'ombre ·
  Grondement → ondes translucides · Serment → halo doré.

## Skins = couches réutilisables (modèle éco)
Silhouette de base partagée + swap de teintes / overlays / variantes de traînée de
Voie. Cheap à produire. **100% visuel, aucun impact stats** (droit vérifié serveur,
cf. `DATA_SCHEMA.md`).

## L'image-icône
Les silhouettes lointaines des autres **Bêtes-Mondes** dans un ciel sans étoiles.
La key art du jeu.

## Pipeline
Greybox → concept (Higgsfield) → génération locale (ComfyUI/Flux, RTX 4090) →
**finition main** (marquée `__HAND__`). Persos & skins vendus = toujours repassés main.
