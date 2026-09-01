# E-formation Carrossier-Peintre

Application de formation interactive, **100 % statique** : aucun build, aucune dépendance,
aucun serveur applicatif. Elle se déploie telle quelle sur GitHub Pages.

```
formation/
├── index.html                # coquille de l'application (SEO, JSON-LD, noscript)
├── build.mjs                 # génère les pages statiques indexables (voir plus bas)
├── lecons/                   # 18 pages HTML + plan du cours, générés — ne pas éditer à la main
├── manifest.webmanifest      # installable sur mobile (PWA)
├── sw.js                     # service worker : consultation hors ligne
├── assets/
│   ├── app.css               # design system complet (thème sombre + clair)
│   ├── app.js                # moteur : routeur, rendu, quiz, progression, recherche
│   └── img/*.svg             # schémas techniques (injectés en ligne, donc thémables)
└── data/
    ├── curriculum.json       # sommaire : modules + métadonnées des leçons
    ├── glossaire.json        # lexique métier
    ├── defauts.json          # base des défauts (leçon 6.1 + outil de diagnostic)
    └── lessons/<id>.json     # une leçon = un fichier, chargé à la demande
```

## Principes d'architecture

| Choix | Raison |
|---|---|
| Contenu en JSON, séparé du code | Ajouter une leçon ne demande **aucune ligne de JavaScript** |
| Une leçon = un fichier, chargé à la demande | La page d'accueil ne télécharge que le sommaire ; le contenu suit l'usage |
| Rendu par blocs typés | Un nouveau type de bloc = une entrée dans `block()` de `app.js` |
| Progression en `localStorage` | Pas de compte, pas de base de données, pas de RGPD à gérer |
| Schémas en SVG injectés | Vectoriels, légers, thémables, et supports des points cliquables |
| Vidéos en façade | Aucune requête YouTube tant que l'utilisateur ne clique pas |

## Ajouter une leçon

1. Créer `data/lessons/<id>.json` (voir le schéma plus bas).
2. Ajouter une entrée dans le tableau `lessons` du module concerné, dans `data/curriculum.json` :

```json
{ "id": "m3l4", "title": "Titre", "duration": 12, "summary": "Résumé court.", "keywords": ["mot", "clé"] }
```

C'est tout : sommaire, barre de progression, recherche, examen blanc et badges
prennent la nouvelle leçon en compte automatiquement.

## Ajouter un module

Ajouter un objet dans `modules` de `curriculum.json` avec `id`, `short`, `title`,
`level`, `summary`, `intro`, `icon` (contenu d'un `<svg viewBox="0 0 24 24">`) et `lessons`.

## Schéma d'une leçon

```json
{
  "id": "m1l1",
  "title": "…",
  "duration": 12,
  "level": "Débutant",
  "objectives": ["…"],
  "video": { "id": "IDENTIFIANT_YOUTUBE", "query": "recherche de secours", "title": "…" },
  "blocks": [ … ],
  "quiz": [ { "q": "…", "choices": ["A","B","C","D"], "answer": 1, "why": "…" } ]
}
```

Le texte accepte un mini-markdown en ligne : `**gras**`, `*italique*`,
`` `code` `` et `[texte](url)`.

### Types de blocs disponibles

| `t` | Champs | Rendu |
|---|---|---|
| `h` | `x` | Titre de section |
| `p` | `x` | Paragraphe |
| `ul` / `ol` | `items[]` | Liste à puces / numérotée |
| `note` | `kind` (`tip`\|`warn`\|`danger`\|`info`), `title`, `x` | Encadré coloré |
| `steps` | `items[{title,x}]` | Étapes numérotées |
| `table` | `head[]`, `rows[][]` | Tableau (scroll horizontal sur mobile) |
| `kpi` | `items[{v,l}]` | Chiffres clés |
| `cmp` | `left{title,items[]}`, `right{…}` | Comparaison deux colonnes |
| `tl` | `items[{title,x}]` | Frise / progression |
| `flip` | `items[{f,b}]` | Cartes mémo retournables |
| `check` | `id`, `items[]` | Check-list cochable et **persistée** |
| `img` | `src`, `caption`, `hotspots[{x,y,label,text}]` | Schéma SVG à points cliquables |
| `video` | `id` ou `query` | Lecteur YouTube en façade |

Les coordonnées `x` / `y` d'un point chaud sont en **pourcentage** de la surface du
schéma : pour un SVG en `viewBox="0 0 720 380"`, un point en (360, 190) s'écrit
`{"x": 50, "y": 50}`.

## Ajouter les vidéos

Chaque leçon affiche un emplacement vidéo. Tant que `video.id` est absent, un bloc
invite à chercher la vidéo (lien de recherche pré-rempli à partir de `video.query`).
Pour intégrer une vidéo, renseigner l'identifiant YouTube :

```json
"video": { "id": "dQw4w9WgXcQ", "title": "Titre affiché" }
```

Le lecteur reste en **façade** : rien n'est chargé depuis YouTube tant que
l'utilisateur n'a pas cliqué, et l'iframe utilise `youtube-nocookie.com`.
Un bloc `{"t":"video", …}` peut aussi être placé n'importe où dans `blocks`.

## Pages statiques indexables

Les routes de l'app sont des fragments (`#/l/m1l2`) : **les moteurs de recherche
les ignorent**, donc aucune leçon n'existait comme URL. `build.mjs` génère à partir
des mêmes JSON une page HTML par leçon dans `lecons/`, plus un plan du cours.

```bash
node formation/build.mjs      # aucune dépendance, ~1 seconde
```

Ce que fait la génération :

- une page par leçon, **entièrement lisible sans JavaScript** (les schémas SVG sont
  intégrés en ligne, les points chauds deviennent du texte, les quiz des `<details>`) ;
- `<title>`, meta description, canonical, Open Graph et JSON-LD `LearningResource`
  + `BreadcrumbList` propres à chaque leçon ;
- un plan du cours (`lecons/index.html`) qui donne aux moteurs un chemin
  d'exploration vers les 18 pages — le pied de page de l'app y renvoie ;
- mise à jour du `sitemap.xml` racine entre les marqueurs `lecons:start` / `lecons:end`,
  sans toucher au reste du fichier.

Ce n'est pas une duplication du moteur de rendu de l'app : le support n'a pas
d'interaction, donc les blocs sont rendus différemment. **Relancez la commande après
toute modification du contenu**, et committez le résultat (GitHub Pages sert les
fichiers tels quels, il n'y a pas d'étape de build côté serveur).

## Développement local

```bash
python3 -m http.server 8000
# puis http://localhost:8000/formation/
```

Un simple double-clic sur `index.html` ne fonctionne pas : `fetch()` est bloqué
sur le protocole `file://`. L'application affiche un message expliquant la marche à suivre.

## Données utilisateur

Tout est stocké dans le navigateur (`localStorage`, clés `cp-progress-v1` et `cp-theme`) :
leçons terminées, scores de quiz, check-lists, XP, badges, série de jours.
Rien n'est envoyé nulle part. L'utilisateur peut exporter sa progression en JSON
ou tout effacer depuis la barre latérale.
