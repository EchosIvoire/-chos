#!/usr/bin/env node
/* =========================================================================
   Génère une page HTML statique par leçon dans /formation/lecons/.
   Objectif : rendre le contenu lisible et indexable SANS JavaScript.
   Les routes de l'app sont en `#/…` : les moteurs ignorent les fragments,
   donc les 18 leçons n'existaient comme URL pour personne.

   Ce n'est pas une copie du moteur de rendu de l'app : le support est
   différent (pas d'interaction), donc le rendu l'est aussi — les quiz
   deviennent des <details>, les points chauds une liste, les cartes mémo
   une liste de définitions. Tout reste utilisable au clavier et sans JS.

   Usage : node formation/build.mjs   (aucune dépendance)
   ========================================================================= */
import { readFile, writeFile, mkdir, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const REPO = join(ROOT, '..');
const OUT  = join(ROOT, 'lecons');
const SITE = 'https://thebenchlab.fr';
const TODAY = new Date().toISOString().slice(0, 10);

const json = async p => JSON.parse(await readFile(p, 'utf8'));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
const md = s => esc(s)
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a class="link" href="$2" rel="noopener">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');
const strip = s => String(s ?? '').replace(/[*`_[\]]/g, '');
const slug = s => strip(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

const ICONS = {
  tip:   '<path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/>',
  warn:  '<path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>',
  danger:'<path d="M12 8v5m0 4h.01"/><circle cx="12" cy="12" r="9"/>',
  info:  '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5m0-4h.01"/>'
};
const NOTE_TITLE = { tip:'Astuce d’atelier', warn:'Attention', danger:'Danger', info:'À retenir' };

/* ---------- rendu statique des blocs ---------- */
const svgCache = new Map();
async function inlineSvg(src){
  if (!svgCache.has(src)) svgCache.set(src, await readFile(join(ROOT, 'assets/img', src), 'utf8'));
  return svgCache.get(src);
}

async function block(b){
  switch (b.t) {
    case 'h':  return `<h2 id="s-${slug(b.x)}">${md(b.x)}</h2>`;
    case 'p':  return `<p>${md(b.x)}</p>`;
    case 'ul': return `<ul>${b.items.map(i => `<li>${md(i)}</li>`).join('')}</ul>`;
    case 'ol': return `<ol>${b.items.map(i => `<li>${md(i)}</li>`).join('')}</ol>`;
    case 'note': {
      const k = b.kind || 'info';
      return `<aside class="note ${k}"><svg class="ni" viewBox="0 0 24 24" aria-hidden="true">${ICONS[k] || ICONS.info}</svg>
        <div><b>${esc(b.title || NOTE_TITLE[k])}</b><p>${md(b.x)}</p></div></aside>`;
    }
    case 'steps':
      return `<div class="steps">${b.items.map(s => `<div class="step"><b>${md(s.title)}</b><span>${md(s.x || '')}</span></div>`).join('')}</div>`;
    case 'table':
      return `<div class="tbl-wrap"><table><thead><tr>${b.head.map(h => `<th>${md(h)}</th>`).join('')}</tr></thead>
        <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${md(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'kpi':
      return `<div class="kpis">${b.items.map(k => `<div class="kpi"><b>${esc(k.v)}</b><span>${esc(k.l)}</span></div>`).join('')}</div>`;
    case 'cmp':
      return `<div class="cmp">
        <div class="l"><b>${md(b.left.title)}</b><ul>${b.left.items.map(i => `<li>${md(i)}</li>`).join('')}</ul></div>
        <div class="r"><b>${md(b.right.title)}</b><ul>${b.right.items.map(i => `<li>${md(i)}</li>`).join('')}</ul></div></div>`;
    case 'tl':
      return `<div class="tl">${b.items.map(i => `<div><b>${md(i.title)}</b><span>${md(i.x || '')}</span></div>`).join('')}</div>`;

    /* Sans JS, une carte à retourner n'a pas de sens : liste de définitions. */
    case 'flip':
      return `<dl class="memo">${b.items.map(f => `<dt>${md(f.f)}</dt><dd>${md(f.b)}</dd>`).join('')}</dl>`;

    /* La check-list devient une liste simple (l'état cochable vit dans l'app). */
    case 'check':
      return `<ul class="static-check">${b.items.map(i => `<li>${md(i)}</li>`).join('')}</ul>`;

    /* Le schéma est intégré en ligne et les points chauds deviennent du texte :
       plus accessible et plus indexable que la version interactive. */
    case 'img': {
      const svg = await inlineSvg(b.src);
      const hs = (b.hotspots || []).length
        ? `<ol class="hot-list">${b.hotspots.map(h => `<li><b>${esc(h.label)}</b> — ${md(h.text)}</li>`).join('')}</ol>` : '';
      return `<figure class="fig"><div class="fig-box">${svg}</div>
        ${b.caption ? `<figcaption>${md(b.caption)}</figcaption>` : ''}${hs}</figure>`;
    }
    case 'video': {
      const q = encodeURIComponent(b.query || 'carrossier peintre');
      return `<p class="video-link"><a class="link" href="https://www.youtube.com/results?search_query=${q}"
        rel="noopener nofollow">Voir des démonstrations vidéo${b.title ? ' : ' + esc(b.title) : ''}</a></p>`;
    }
    default: return '';
  }
}

/* Le quiz reste jouable sans JS grâce à <details>. */
const quizStatic = q => !q?.length ? '' : `
  <section class="quiz-static">
    <h2 id="s-quiz">Testez vos connaissances</h2>
    <ol>${q.map(x => `<li>
      <p class="q-txt">${md(x.q)}</p>
      <ul class="q-choices">${x.choices.map(c => `<li>${md(c)}</li>`).join('')}</ul>
      <details><summary>Afficher la réponse</summary>
        <p><b>Réponse :</b> ${md(x.choices[x.answer])}</p>
        <p>${md(x.why || '')}</p></details></li>`).join('')}</ol>
  </section>`;

/* ---------- gabarit de page ---------- */
function page({ L, meta, idx, prev, next, mod, modIdx, body, quiz }) {
  const url = `${SITE}/formation/lecons/${L.id}.html`;
  const desc = meta.summary || `Leçon de formation au métier de carrossier-peintre : ${L.title}.`;
  const ld = {
    '@context':'https://schema.org', '@type':'LearningResource',
    name: L.title, description: desc, url,
    inLanguage:'fr-FR', educationalLevel: L.level || 'Débutant',
    learningResourceType:'Leçon', timeRequired:`PT${L.duration || 12}M`,
    teaches: L.objectives || [], keywords: (meta.keywords || []).join(', '),
    isPartOf: { '@type':'Course', name:'E-formation Carrossier-Peintre', url:`${SITE}/formation/`,
                provider:{ '@type':'Organization', name:'TheBenchLab', url:`${SITE}/` } },
    isAccessibleForFree: true
  };
  const crumbs = {
    '@context':'https://schema.org', '@type':'BreadcrumbList',
    itemListElement: [
      { '@type':'ListItem', position:1, name:'Formation', item:`${SITE}/formation/` },
      { '@type':'ListItem', position:2, name:'Plan du cours', item:`${SITE}/formation/lecons/` },
      { '@type':'ListItem', position:3, name:L.title, item:url }
    ]
  };
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(L.title)} — Formation carrossier-peintre</title>
<meta name="description" content="${esc(desc)}" />
<meta name="robots" content="index, follow, max-image-preview:large" />
<meta name="theme-color" content="#0d0f14" media="(prefers-color-scheme: dark)" />
<meta name="theme-color" content="#f6f7fb" media="(prefers-color-scheme: light)" />
<link rel="canonical" href="${url}" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="TheBenchLab" />
<meta property="og:url" content="${url}" />
<meta property="og:title" content="${esc(L.title)} — Formation carrossier-peintre" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${SITE}/formation/assets/img/og-formation.png" />
<meta property="og:locale" content="fr_FR" />
<meta name="twitter:card" content="summary_large_image" />
<link rel="icon" href="../assets/img/icon.svg" type="image/svg+xml" />
<link rel="stylesheet" href="../assets/app.css" />
<link rel="stylesheet" href="static.css" />
<script type="application/ld+json">${JSON.stringify(ld)}</script>
<script type="application/ld+json">${JSON.stringify(crumbs)}</script>
</head>
<body class="static-page">
<a class="skip" href="#main">Aller au contenu</a>

<header class="topbar">
  <a class="brand" href="../">
    <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 20l2-7a4 4 0 013.8-2.8h12.4A4 4 0 0126 13l2 7v5a1 1 0 01-1 1h-3a1 1 0 01-1-1v-2H9v2a1 1 0 01-1 1H5a1 1 0 01-1-1z"/><circle cx="9" cy="20" r="1.6"/><circle cx="23" cy="20" r="1.6"/></svg></span>
    <span class="brand-txt"><b>Carrosserie</b><i>E-formation</i></span>
  </a>
  <nav class="top-nav" aria-label="Navigation principale">
    <a href="./">Plan du cours</a>
    <a href="../">Formation interactive</a>
  </nav>
</header>

<main id="main" class="content" tabindex="-1">
<article class="wrap lesson">
  <nav class="crumb" aria-label="Fil d'Ariane">
    <a href="../">Formation</a> <span>›</span>
    <a href="./">Plan du cours</a> <span>›</span>
    <span>${esc(mod.title)}</span>
  </nav>

  <h1>${esc(L.title)}</h1>
  <div class="lesson-meta">
    <span class="chip">Parcours ${modIdx + 1} · ${esc(mod.title)}</span>
    <span class="chip">Leçon ${idx + 1} sur 18</span>
    <span class="chip">${L.duration || 12} min</span>
    <span class="chip">${esc(L.level || 'Tous niveaux')}</span>
  </div>

  <p class="cta-app"><a class="btn btn-primary" href="../#/l/${L.id}">Suivre cette leçon dans la version interactive</a>
    <span class="muted">quiz corrigés, schémas cliquables, suivi de progression</span></p>

  ${L.objectives?.length ? `<div class="objectives"><b>À la fin de cette leçon</b>
    <ul>${L.objectives.map(o => `<li>${md(o)}</li>`).join('')}</ul></div>` : ''}

  ${body}
  ${quiz}

  <nav class="pager" aria-label="Leçons voisines">
    ${prev ? `<a href="${prev.id}.html"><small>← Précédent</small><b>${esc(prev.title)}</b></a>` : '<span></span>'}
    ${next ? `<a class="nx" href="${next.id}.html"><small>Suivant →</small><b>${esc(next.title)}</b></a>` : '<span></span>'}
  </nav>
</article>
</main>

<footer class="static-foot">
  <p><a href="./">Plan complet du cours</a> · <a href="../">Formation interactive</a> · <a href="/">TheBenchLab</a></p>
  <p class="muted">Formation gratuite au métier de carrossier-peintre. Cette page est la version texte,
    consultable sans JavaScript et imprimable.</p>
</footer>
</body>
</html>`;
}

/* ---------- page d'index (chemin d'exploration pour les moteurs) ---------- */
function indexPage(cur, lessons) {
  const total = lessons.length;
  const mins = lessons.reduce((a, l) => a + (l.duration || 12), 0);
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Plan du cours — Formation carrossier-peintre</title>
<meta name="description" content="Le programme complet de la formation carrossier-peintre : ${cur.modules.length} parcours et ${total} leçons, de la sécurité en atelier au lustrage final. Version texte, sans JavaScript." />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="${SITE}/formation/lecons/" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${SITE}/formation/lecons/" />
<meta property="og:title" content="Plan du cours — Formation carrossier-peintre" />
<meta property="og:image" content="${SITE}/formation/assets/img/og-formation.png" />
<link rel="icon" href="../assets/img/icon.svg" type="image/svg+xml" />
<link rel="stylesheet" href="../assets/app.css" />
<link rel="stylesheet" href="static.css" />
</head>
<body class="static-page">
<a class="skip" href="#main">Aller au contenu</a>
<header class="topbar">
  <a class="brand" href="../">
    <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32"><path d="M4 20l2-7a4 4 0 013.8-2.8h12.4A4 4 0 0126 13l2 7v5a1 1 0 01-1 1h-3a1 1 0 01-1-1v-2H9v2a1 1 0 01-1 1H5a1 1 0 01-1-1z"/><circle cx="9" cy="20" r="1.6"/><circle cx="23" cy="20" r="1.6"/></svg></span>
    <span class="brand-txt"><b>Carrosserie</b><i>E-formation</i></span>
  </a>
  <nav class="top-nav" aria-label="Navigation principale"><a href="../">Formation interactive</a></nav>
</header>
<main id="main" class="content" tabindex="-1">
<div class="wrap lesson">
  <h1>Plan du cours</h1>
  <p class="muted">${cur.modules.length} parcours, ${total} leçons, environ ${Math.round(mins / 60)} heures de contenu.
    Chaque leçon est consultable ici en version texte, ou dans la
    <a class="link" href="../">formation interactive</a> avec ses quiz et ses schémas cliquables.</p>
  ${cur.modules.map((m, i) => `
  <section class="plan-mod">
    <h2 id="m-${m.id}">Parcours ${i + 1} — ${esc(m.title)}</h2>
    <p>${esc(m.intro || m.summary)}</p>
    <ol class="plan-list">${m.lessons.map(l => `<li>
      <a href="${l.id}.html"><b>${esc(l.title)}</b></a>
      <span class="muted">${esc(l.summary || '')}</span>
      <span class="chip">${l.duration} min</span></li>`).join('')}</ol>
  </section>`).join('')}
</div>
</main>
<footer class="static-foot">
  <p><a href="../">Formation interactive</a> · <a href="/">TheBenchLab</a></p>
</footer>
</body>
</html>`;
}

/* ---------- exécution ---------- */
const cur = await json(join(ROOT, 'data/curriculum.json'));
const flat = cur.modules.flatMap((m, mi) => m.lessons.map(l => ({ ...l, mod:m, modIdx:mi })));
await mkdir(OUT, { recursive: true });

let n = 0;
for (const [idx, meta] of flat.entries()) {
  const L = await json(join(ROOT, 'data/lessons', meta.id + '.json'));
  const blocks = [];
  if (L.video) blocks.push(await block({ t:'video', ...L.video }));
  for (const b of L.blocks || []) blocks.push(await block(b));
  const html = page({
    L, meta, idx, mod: meta.mod, modIdx: meta.modIdx,
    prev: flat[idx - 1], next: flat[idx + 1],
    body: blocks.join('\n  '), quiz: quizStatic(L.quiz)
  });
  await writeFile(join(OUT, meta.id + '.html'), html);
  n++;
}
await writeFile(join(OUT, 'index.html'), indexPage(cur, flat));

/* Mise à jour du sitemap entre les marqueurs, sans toucher au reste. */
const sp = join(REPO, 'sitemap.xml');
let sm = await readFile(sp, 'utf8');
const urls = [
  `  <url>\n    <loc>${SITE}/formation/lecons/</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>`,
  ...flat.map(l => `  <url>\n    <loc>${SITE}/formation/lecons/${l.id}.html</loc>\n    <lastmod>${TODAY}</lastmod>\n    <changefreq>yearly</changefreq>\n    <priority>0.7</priority>\n  </url>`)
].join('\n');
const START = '  <!-- lecons:start (généré par formation/build.mjs) -->';
const END   = '  <!-- lecons:end -->';
const blockTxt = `${START}\n${urls}\n${END}`;
sm = sm.includes(START)
  ? sm.replace(new RegExp(`${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`), blockTxt)
  : sm.replace('</urlset>', `${blockTxt}\n</urlset>`);
await writeFile(sp, sm);

console.log(`${n} leçons + 1 plan générés dans formation/lecons/`);
console.log(`sitemap.xml : ${flat.length + 1} URL de formation référencées`);
