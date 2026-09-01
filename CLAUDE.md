# TheBenchLab — repères de travail

Site statique servi par GitHub Pages depuis `main`. **Pas de framework, pas de build
côté serveur** : les fichiers du dépôt sont exactement ceux que le navigateur reçoit.
Les dépendances npm servent uniquement au développement (génération et audit).

## Structure

| Chemin | Rôle |
|---|---|
| `index.html`, `about.html`, `blog/` | Le blog. Chaque page porte son CSS en ligne, avec ses propres tokens. |
| `formation/` | E-formation carrossier-peintre : application monopage en JS vanilla. |
| `formation/data/` | **La source unique du contenu** (curriculum, leçons, glossaire, défauts). |
| `formation/lecons/` | **Généré — ne jamais éditer à la main.** Pages statiques indexables. |
| `scripts/` | Outillage : audit qualité, hook de démarrage. |
| `bot.html`, `xpipedream*.html` | Outils internes. Hors audit, `bot.html` est interdit aux robots. |

## Commandes

```bash
npm run build        # régénère formation/lecons/ + le sitemap depuis formation/data/
npm run audit        # Lighthouse + axe-core sur tout le site, seuils appliqués
npm run audit:fast   # sans navigateur : vérifie seulement la fraîcheur du build
npm run serve        # serveur local sur :8765
```

## Règles à respecter

1. **Toute modification de `formation/data/**` impose `npm run build`**, et le résultat
   se committe. Un hook `PostToolUse` le fait automatiquement pendant une session
   Claude Code, et un workflow GitHub Actions rattrape les modifications faites
   ailleurs — mais le contenu généré doit toujours arriver dans le même commit que
   sa source quand c'est possible.

2. **Ne jamais éditer `formation/lecons/`** : le prochain build écrase tout.
   Pour changer le rendu de ces pages, modifier `formation/build.mjs`.

3. **Contraste : viser 4.5:1 minimum**, dans les deux thèmes. Le piège récurrent de
   ce dépôt : une couleur d'accent lisible en thème sombre ne l'est pas en clair.
   D'où les tokens séparés `--acc` / `--acc-text` (formation) et `--accent` /
   `--accent-text` (blog) : les fonds gardent la teinte vive, le texte prend la
   variante conforme. Vérifier avec `npm run audit` avant de committer une couleur.

4. **`formation/assets/app.js` ne doit rien charger d'inutile au démarrage.**
   L'index de recherche plein texte se construit à la première ouverture de la
   recherche, jamais au boot : charger les 18 leçons d'emblée avait fait passer la
   page d'accueil de 88 Ko à 228 Ko.

5. **Les pages légales portent `noindex`** volontairement, et sont donc absentes du
   sitemap. Leur score SEO Lighthouse plafonne à 66 : c'est attendu, pas un défaut.

6. **`og:image` doit rester un PNG.** X, LinkedIn et Facebook ne rendent pas le SVG.
   Les sources vectorielles sont dans `og/` et `formation/assets/img/`.

7. **`npm run audit` a besoin du réseau.** L'article GPU charge Chart.js depuis un
   CDN : hors ligne, Lighthouse fait tomber ses « bonnes pratiques » à 96. C'est un
   faux positif, pas une régression — la page a un repli qui évite l'erreur JavaScript.

## Seuils qualité

Définis dans `scripts/quality-budget.json` : performance ≥ 95, accessibilité 100,
bonnes pratiques 100, SEO ≥ 95, et zéro violation axe-core. Relever un seuil est une
décision à assumer, pas un moyen de faire passer la CI.

## Skills du projet

`.claude/skills/` contient huit skills vendorisées (audit qualité, accessibilité,
performance, Core Web Vitals, SEO, bonnes pratiques, tests Playwright, direction
visuelle). Voir `.claude/skills/README.md` pour leur provenance et leurs licences.
