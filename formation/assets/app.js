/* =========================================================================
   E-formation Carrossier-Peintre — moteur d'application
   Vanilla JS, zéro dépendance. Tout le contenu vient de /data (JSON).
   Pour ajouter une leçon : 1 fichier JSON + 1 ligne dans curriculum.json.
   ========================================================================= */
(() => {
'use strict';

/* ---------- constantes ---------- */
const KEY   = 'cp-progress-v1';
const XP_LESSON = 25, XP_QUIZ = 5, XP_EXAM = 60;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const BADGES = [
  { id:'first',  em:'🔧', t:'Premier tour de clé', d:'1re leçon terminée',      test:s => s.doneCount >= 1 },
  { id:'safe',   em:'🦺', t:'Sécurité d’abord',    d:'Module 1 terminé',        test:s => s.mods.metier === 1 },
  { id:'half',   em:'🎯', t:'Mi-parcours',         d:'50 % de la formation',    test:s => s.pct >= 50 },
  { id:'quiz',   em:'🧠', t:'Tête bien faite',     d:'5 quiz réussis',          test:s => s.quizPass >= 5 },
  { id:'color',  em:'🎨', t:'Œil colorimétrique',  d:'Module peinture terminé', test:s => s.mods.peinture === 1 },
  { id:'full',   em:'🏆', t:'Carrossier complet',  d:'100 % des leçons',        test:s => s.pct === 100 },
  { id:'exam',   em:'📜', t:'Reçu à l’examen',     d:'≥ 80 % à l’examen blanc', test:s => s.bestExam >= 80 },
  { id:'streak', em:'🔥', t:'Régulier',            d:'3 jours d’affilée',       test:s => s.streak >= 3 }
];

/* ---------- état persistant ---------- */
const blank = () => ({ done:{}, quiz:{}, checks:{}, xp:0, badges:[], bestExam:0, streak:1, last:'', days:[] });
let P = blank();
try { P = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* stockage indisponible */ }

const save = () => { try { localStorage.setItem(KEY, JSON.stringify(P)); } catch {} };

function touchStreak(){
  const d = new Date().toISOString().slice(0,10);
  if (P.days.includes(d)) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0,10);
  P.streak = P.days.includes(y) ? (P.streak || 0) + 1 : 1;
  P.days = [...P.days.slice(-30), d];
  save();
}

/* ---------- données ---------- */
const DB = { curriculum:null, lessons:new Map(), glossary:null, svg:new Map(), allLoaded:false };

async function json(path){
  const r = await fetch(path, { cache:'no-cache' });
  if (!r.ok) throw new Error(path + ' → ' + r.status);
  return r.json();
}
async function getCurriculum(){
  if (!DB.curriculum) {
    DB.curriculum = await json('data/curriculum.json');
    DB.flat = DB.curriculum.modules.flatMap(m => m.lessons.map(l => ({ ...l, module:m })));
  }
  return DB.curriculum;
}
async function getLesson(id){
  if (!DB.lessons.has(id)) DB.lessons.set(id, await json(`data/lessons/${id}.json`));
  return DB.lessons.get(id);
}
async function loadAll(){
  if (DB.allLoaded) return;
  await getCurriculum();
  await Promise.all(DB.flat.map(l => getLesson(l.id).catch(() => null)));
  DB.allLoaded = true;
}

/* ---------- utilitaires texte ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
/* mini-markdown en ligne : **gras**, *italique*, `code`, [texte](url) */
const md = s => esc(s)
  .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a class="link" href="$2" target="_blank" rel="noopener">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>')
  .replace(/`([^`]+)`/g, '<code>$1</code>');
const strip = s => String(s ?? '').replace(/[*`_[\]]/g, '');
const norm  = s => strip(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

/* ---------- calculs de progression ---------- */
function stats(){
  const flat = DB.flat || [];
  const doneCount = flat.filter(l => P.done[l.id]).length;
  const pct  = flat.length ? Math.round(doneCount / flat.length * 100) : 0;
  const mods = {};
  (DB.curriculum?.modules || []).forEach(m => {
    const d = m.lessons.filter(l => P.done[l.id]).length;
    mods[m.id] = m.lessons.length ? d / m.lessons.length : 0;
  });
  const quizPass = Object.values(P.quiz).filter(q => q.total && q.score / q.total >= .7).length;
  return { doneCount, total:flat.length, pct, mods, quizPass, bestExam:P.bestExam || 0, streak:P.streak || 1 };
}

function checkBadges(){
  const s = stats();
  BADGES.forEach(b => {
    if (!P.badges.includes(b.id) && b.test(s)) {
      P.badges.push(b.id); save();
      toast(`Badge débloqué — ${b.t}`, 'xp', b.em);
    }
  });
}
function addXP(n){
  P.xp = (P.xp || 0) + n; save();
  const chip = $('#xp-chip');
  $('#xp-val').textContent = P.xp;
  chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump');
}

/* ---------- toasts ---------- */
function toast(msg, kind = '', emoji = ''){
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.innerHTML = emoji
    ? `<span style="font-size:1.1rem">${emoji}</span>${esc(msg)}`
    : `<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>${esc(msg)}`;
  $('#toasts').appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, 2600);
  setTimeout(() => t.remove(), 3000);
}

/* =========================================================================
   RENDU DES BLOCS DE CONTENU
   ========================================================================= */
const ICONS = {
  tip:   '<path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7V17h8v-2.3A7 7 0 0012 2z"/>',
  warn:  '<path d="M12 9v4m0 4h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z"/>',
  danger:'<path d="M12 8v5m0 4h.01"/><circle cx="12" cy="12" r="9"/>',
  info:  '<circle cx="12" cy="12" r="9"/><path d="M12 16v-5m0-4h.01"/>'
};
const NOTE_TITLE = { tip:'Astuce d’atelier', warn:'Attention', danger:'Danger', info:'À retenir' };

function block(b, ctx){
  switch (b.t) {
    case 'h':  return `<h2 id="s-${slug(b.x)}">${md(b.x)}</h2>`;
    case 'p':  return `<p>${md(b.x)}</p>`;
    case 'ul': return `<ul>${b.items.map(i => `<li>${md(i)}</li>`).join('')}</ul>`;
    case 'ol': return `<ol>${b.items.map(i => `<li>${md(i)}</li>`).join('')}</ol>`;

    case 'note': {
      const k = b.kind || 'info';
      return `<div class="note ${k}"><svg class="ni" viewBox="0 0 24 24">${ICONS[k] || ICONS.info}</svg>
        <div><b>${esc(b.title || NOTE_TITLE[k])}</b><p>${md(b.x)}</p></div></div>`;
    }
    case 'steps':
      return `<div class="steps">${b.items.map(s =>
        `<div class="step"><b>${md(s.title)}</b><span>${md(s.x || '')}</span></div>`).join('')}</div>`;

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

    case 'flip':
      return `<div class="flips">${b.items.map(f =>
        `<div class="flip" tabindex="0" role="button" aria-pressed="false" aria-label="Question : ${esc(strip(f.f))}. Retourner la carte">
           <div class="flip-in"><div class="flip-f">${md(f.f)}</div><div class="flip-b">${md(f.b)}</div></div>
         </div>`).join('')}</div>`;

    case 'check': {
      const key = `${ctx.id}:${b.id || 'c'}`;
      const on = P.checks[key] || [];
      return `<div class="checks" data-check="${esc(key)}">${b.items.map((i, n) =>
        `<button class="check ${on.includes(n) ? 'on' : ''}" data-i="${n}" aria-pressed="${on.includes(n)}">
           <span class="box"><svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg></span>
           <span>${md(i)}</span></button>`).join('')}</div>`;
    }

    case 'img': {
      const hs = (b.hotspots || []).map((h, i) =>
        `<button class="hot" data-i="${i}" style="left:${h.x}%;top:${h.y}%" aria-label="${esc(h.label)}">${i + 1}</button>`).join('');
      return `<figure class="fig" data-fig="${esc(b.src)}"${b.hotspots ? ` data-hot='${esc(JSON.stringify(b.hotspots))}'` : ''}>
        <div class="fig-box"><div class="fig-svg" data-src="${esc(b.src)}">
          <div class="loader"><i></i><i></i><i></i></div>${hs}</div></div>
        ${b.hotspots ? `<div class="hot-panel"><span class="muted">Cliquez sur les points numérotés du schéma.</span></div>` : ''}
        ${b.caption ? `<figcaption>${md(b.caption)}</figcaption>` : ''}</figure>`;
    }

    case 'video': return video(b);
    default: return '';
  }
}

function video(v){
  if (v.id) {
    return `<div class="video" data-yt="${esc(v.id)}">
      <div class="video-facade" role="button" tabindex="0" aria-label="Lire la vidéo">
        <img loading="lazy" src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" />
        <span class="play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
      </div></div>`;
  }
  const q = encodeURIComponent(v.query || 'carrossier peintre tutoriel');
  return `<div class="video-empty">
    <span class="play" style="width:44px;height:44px;background:var(--bg2);border:1px solid var(--border2)">
      <svg viewBox="0 0 24 24" style="fill:var(--acc)"><path d="M8 5v14l11-7z"/></svg></span>
    <b style="font-size:.92rem">${esc(v.title || 'Démonstration vidéo')}</b>
    <small>Voir le geste en mouvement aide énormément sur cette partie.</small>
    <a class="btn btn-ghost" href="https://www.youtube.com/results?search_query=${q}" target="_blank" rel="noopener">
      Voir des démonstrations</a></div>`;
}

const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

/* injection des schémas SVG (thème dynamique + points chauds) */
async function hydrateFigures(root){
  for (const el of $$('.fig-svg', root)) {
    const src = el.dataset.src;
    try {
      if (!DB.svg.has(src)) DB.svg.set(src, await (await fetch(`assets/img/${src}`)).text());
      $('.loader', el)?.remove();
      el.insertAdjacentHTML('afterbegin', DB.svg.get(src));
    } catch { el.innerHTML = '<p class="muted" style="padding:1rem;text-align:center">Schéma indisponible.</p>'; }
  }
  $$('.fig[data-hot]', root).forEach(fig => {
    const hots = JSON.parse(fig.dataset.hot);
    const panel = $('.hot-panel', fig);
    $$('.hot', fig).forEach(btn => btn.addEventListener('click', () => {
      $$('.hot', fig).forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      const h = hots[+btn.dataset.i];
      panel.innerHTML = `<b>${esc(h.label)}</b> — ${md(h.text)}`;
    }));
  });
}

/* =========================================================================
   QUIZ
   ========================================================================= */
function quizHTML(quiz, id){
  return `<section class="quiz" data-quiz="${esc(id)}">
    <div class="quiz-head">
      <svg viewBox="0 0 24 24"><path d="M9 9a3 3 0 116 0c0 2-3 2.2-3 5m0 4h.01"/><circle cx="12" cy="12" r="10"/></svg>
      <b>Quiz — validez vos acquis</b><span class="muted" data-qscore>0 / ${quiz.length}</span>
    </div>
    ${quiz.map((q, i) => `<div class="q" data-q="${i}" data-a="${q.answer}">
      <p>${i + 1}. ${md(q.q)}</p>
      <div class="opts">${q.choices.map((c, j) =>
        `<button class="opt" data-j="${j}"><span class="mark">${'ABCD'[j]}</span><span>${md(c)}</span></button>`).join('')}</div>
      <div class="why" role="status" hidden>${md(q.why || '')}</div>
    </div>`).join('')}
  </section>`;
}

function bindQuiz(root, lessonId, total){
  const box = $('.quiz', root); if (!box) return;
  let score = 0, answered = 0;
  $$('.q', box).forEach(q => {
    const good = +q.dataset.a;
    $$('.opt', q).forEach(opt => opt.addEventListener('click', () => {
      if (q.dataset.locked) return;
      q.dataset.locked = '1';
      const j = +opt.dataset.j;
      $$('.opt', q).forEach(o => o.classList.add('locked'));
      opt.classList.add(j === good ? 'good' : 'bad');
      if (j !== good) $$('.opt', q)[good].classList.add('good');
      $('.why', q).hidden = false;
      answered++;
      if (j === good) { score++; addXP(XP_QUIZ); }
      $('[data-qscore]', box).textContent = `${score} / ${total}`;
      if (answered === total) {
        P.quiz[lessonId] = { score, total }; save();
        checkBadges();
        toast(score / total >= .7 ? `Quiz réussi : ${score}/${total}` : `Quiz : ${score}/${total} — relisez la leçon`);
      }
    }));
  });
}

/* =========================================================================
   VUES
   ========================================================================= */
const view = $('#main');
const SITE = 'E-formation Carrossier-Peintre';

/* Le titre ne changeait jamais : lien partagé illisible, onglets identiques,
   et aucun repère pour un lecteur d'écran au changement de vue. */
function setTitle(t){
  document.title = t ? `${t} — ${SITE}` : `${SITE} | Formation interactive gratuite`;
  const live = $('#route-live');
  if (live) live.textContent = t || 'Accueil';
}

function setView(html){
  view.innerHTML = `<div class="wrap">${html}</div>`;
  /* Le scroll est reporté à la frame suivante : appelé juste après innerHTML,
     il force le navigateur à recalculer la mise en page de façon synchrone. */
  if (scrollY) requestAnimationFrame(() => window.scrollTo({ top:0, behavior:'auto' }));
}

/* ---- accueil ---- */
async function viewHome(){
  const c = await getCurriculum(), s = stats();
  setTitle('');
  const next = DB.flat.find(l => !P.done[l.id]) || DB.flat[0];
  const heures = Math.round(DB.flat.reduce((a, l) => a + (l.duration || 10), 0) / 60);

  setView(`
    <section class="hero">
      <span class="eyebrow">Formation métier · gratuite</span>
      <h1>Devenez <span>carrossier-peintre</span><br>sans quitter l’atelier.</h1>
      <p>Un parcours complet, du diagnostic de choc au lustrage final : ${DB.flat.length} leçons interactives,
         des schémas cliquables, des quiz, des outils de calcul métier et un examen blanc.
         Votre progression est enregistrée dans votre navigateur — aucun compte, aucune donnée envoyée.</p>
      <div class="hero-cta">
        <a class="btn btn-primary" href="#/l/${next.id}">
          <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>
          ${s.doneCount ? 'Reprendre : ' + esc(next.title) : 'Commencer le parcours'}</a>
        <a class="btn btn-ghost" href="#/outils">Outils d’atelier</a>
        <a class="btn btn-ghost" href="#/examen">Examen blanc</a>
      </div>
      <div class="stats">
        <div class="stat"><b>${c.modules.length}</b><span>Parcours</span></div>
        <div class="stat"><b>${DB.flat.length}</b><span>Leçons</span></div>
        <div class="stat"><b>~${heures} h</b><span>De contenu</span></div>
        <div class="stat"><b>${s.pct}%</b><span>Progression</span></div>
      </div>
    </section>

    <div class="sec-title"><h2>Les 6 parcours</h2><span class="muted">Suivez-les dans l’ordre, ou piochez selon vos besoins</span></div>
    <div class="mod-grid">
      ${c.modules.map((m, i) => {
        const p = Math.round((s.mods[m.id] || 0) * 100);
        return `<a class="mod-card ${p === 100 ? 'complete' : ''}" href="#/m/${m.id}">
          <div class="top">
            <span class="mod-ico"><svg viewBox="0 0 24 24">${m.icon || ICONS.info}</svg></span>
            <div><h3>${esc(m.title)}</h3><span class="muted" style="font-size:.75rem">Parcours ${i + 1}</span></div>
          </div>
          <p>${esc(m.summary)}</p>
          <div class="mod-meta"><span class="chip">${m.lessons.length} leçons</span>
            <span class="chip">${m.lessons.reduce((a, l) => a + (l.duration || 10), 0)} min</span>
            <span class="chip">${esc(m.level || 'Tous niveaux')}</span></div>
          <div class="bar"><i style="width:${p}%"></i></div>
        </a>`;
      }).join('')}
    </div>

    <div class="sec-title"><h2>Vos badges</h2><span class="muted">${P.badges.length} / ${BADGES.length} débloqués</span></div>
    <div class="badges">${BADGES.map(b => `<div class="badge ${P.badges.includes(b.id) ? 'on' : ''}">
      <span class="em">${b.em}</span><b>${esc(b.t)}</b><span>${esc(b.d)}</span></div>`).join('')}</div>

    <div class="sec-title"><h2>Comment ça marche</h2></div>
    <div class="steps">
      <div class="step"><b>Apprenez</b><span>Chaque leçon mêle texte court, schémas interactifs, vidéo et fiches mémo.</span></div>
      <div class="step"><b>Validez</b><span>Un quiz corrigé en fin de leçon, avec l’explication de chaque réponse.</span></div>
      <div class="step"><b>Pratiquez</b><span>Des outils de calcul réels : mélange 2K, choix de grain, diagnostic de défaut.</span></div>
      <div class="step"><b>Certifiez</b><span>L’examen blanc pioche 15 questions au hasard dans tout le programme.</span></div>
    </div>`);
}

/* ---- module ---- */
async function viewModule(id){
  const c = await getCurriculum();
  const m = c.modules.find(x => x.id === id);
  if (!m) return notFound();
  const p = Math.round((stats().mods[m.id] || 0) * 100);
  setTitle(m.title);
  setView(`
    <div class="crumb"><a href="#/">Parcours</a> <span>›</span> <span>${esc(m.title)}</span></div>
    <section class="hero" style="padding:1.7rem 1.5rem">
      <span class="eyebrow">Parcours ${c.modules.indexOf(m) + 1}</span>
      <h1 style="font-size:clamp(1.5rem,3.4vw,2.1rem)">${esc(m.title)}</h1>
      <p>${esc(m.intro || m.summary)}</p>
      <div class="stats" style="grid-template-columns:repeat(auto-fit,minmax(108px,1fr))">
        <div class="stat"><b>${m.lessons.length}</b><span>Leçons</span></div>
        <div class="stat"><b>${m.lessons.reduce((a, l) => a + (l.duration || 10), 0)} min</b><span>Durée</span></div>
        <div class="stat"><b>${p}%</b><span>Terminé</span></div>
      </div>
    </section>
    <div class="sec-title"><h2>Leçons</h2></div>
    <div class="mod-grid">${m.lessons.map((l, i) => `
      <a class="mod-card ${P.done[l.id] ? 'complete' : ''}" href="#/l/${l.id}">
        <div class="top"><span class="mod-ico" style="${P.done[l.id] ? 'color:var(--acc2)' : ''}">
          <svg viewBox="0 0 24 24">${P.done[l.id] ? '<path d="M20 6L9 17l-5-5"/>' : '<path d="M5 4l14 8-14 8z"/>'}</svg></span>
          <div><h3>${esc(l.title)}</h3><span class="muted" style="font-size:.75rem">Leçon ${i + 1} · ${l.duration} min</span></div></div>
        <p>${esc(l.summary || '')}</p>
      </a>`).join('')}</div>`);
}

/* ---- leçon ---- */
async function viewLesson(id){
  await getCurriculum();
  const meta = DB.flat.find(l => l.id === id);
  if (!meta) return notFound();
  view.innerHTML = '<div class="loader"><i></i><i></i><i></i></div>';
  let L; try { L = await getLesson(id); } catch { return setView(`<div class="empty">Leçon introuvable.<br><a class="link" href="#/">Retour</a></div>`); }

  const idx  = DB.flat.findIndex(l => l.id === id);
  const prev = DB.flat[idx - 1], next = DB.flat[idx + 1];
  const ctx  = { id };
  setTitle(L.title);

  setView(`
    <article class="lesson">
      <div class="crumb"><a href="#/">Parcours</a> <span>›</span>
        <a href="#/m/${meta.module.id}">${esc(meta.module.title)}</a> <span>›</span>
        <span>Leçon ${idx + 1}</span></div>
      <h1>${esc(L.title)}</h1>
      <div class="lesson-meta">
        <span class="chip">⏱ ${L.duration || meta.duration} min</span>
        <span class="chip">${esc(L.level || 'Tous niveaux')}</span>
        ${P.done[id] ? '<span class="chip" style="color:var(--acc2);border-color:var(--acc2)">✓ Terminée</span>' : ''}
      </div>
      ${L.objectives?.length ? `<div class="objectives"><b>À la fin de cette leçon</b>
        <ul>${L.objectives.map(o => `<li>${md(o)}</li>`).join('')}</ul></div>` : ''}
      ${L.video ? video(L.video) : ''}
      ${(L.blocks || []).map(b => block(b, ctx)).join('')}
      ${L.quiz?.length ? quizHTML(L.quiz, id) : ''}

      <div class="done-bar">
        <p>${P.done[id] ? 'Leçon validée. Vous pouvez la relire à tout moment.' : 'Vous avez tout lu ? Marquez la leçon comme terminée pour gagner ' + XP_LESSON + ' XP.'}</p>
        <button class="btn ${P.done[id] ? 'btn-ghost' : 'btn-primary'}" id="btn-done">
          <svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>
          ${P.done[id] ? 'Marquer comme non terminée' : 'Marquer comme terminée'}</button>
        <button class="btn btn-ghost" onclick="window.print()">Imprimer la fiche</button>
      </div>
      <div class="pager">
        ${prev ? `<a href="#/l/${prev.id}"><small>← Précédent</small><b>${esc(prev.title)}</b></a>` : '<span></span>'}
        ${next ? `<a class="nx" href="#/l/${next.id}"><small>Suivant →</small><b>${esc(next.title)}</b></a>`
               : `<a class="nx" href="#/examen"><small>Fin du parcours →</small><b>Passer l’examen blanc</b></a>`}
      </div>
    </article>`);

  hydrateFigures(view);
  bindQuiz(view, id, L.quiz?.length || 0);
  bindLessonUI(id, L);
  touchStreak();
}

function bindLessonUI(id){
  /* cartes mémo */
  $$('.flip').forEach(f => {
    const go = () => f.setAttribute('aria-pressed', f.classList.toggle('on'));
    f.addEventListener('click', go);
    f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  /* check-lists persistées */
  $$('.checks').forEach(list => {
    const key = list.dataset.check;
    $$('.check', list).forEach(c => c.addEventListener('click', () => {
      const i = +c.dataset.i, cur = new Set(P.checks[key] || []);
      const on = c.classList.toggle('on');
      c.setAttribute('aria-pressed', on);
      on ? cur.add(i) : cur.delete(i);
      P.checks[key] = [...cur]; save();
    }));
  });
  /* vidéos : chargement à la demande (aucune requête YouTube avant le clic) */
  $$('.video-facade').forEach(f => {
    const play = () => {
      const box = f.parentElement;
      box.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${box.dataset.yt}?autoplay=1&rel=0"
        title="Vidéo de la leçon" allow="accelerometer;autoplay;encrypted-media;picture-in-picture" allowfullscreen loading="lazy"></iframe>`;
    };
    f.addEventListener('click', play);
    f.addEventListener('keydown', e => { if (e.key === 'Enter') play(); });
  });
  /* validation */
  $('#btn-done')?.addEventListener('click', () => {
    if (P.done[id]) { delete P.done[id]; save(); }
    else { P.done[id] = Date.now(); save(); addXP(XP_LESSON); toast('Leçon validée ! +' + XP_LESSON + ' XP'); checkBadges(); }
    refreshChrome(); viewLesson(id);
  });
}

/* ---- outils ---- */
const GRAINS = [
  { step:'Décapage / mise à nu de la tôle',            grain:'P60 – P80',   note:'Disque ou meuleuse. Jamais sur zone galvanisée fine.' },
  { step:'Dégrossissage du mastic polyester',          grain:'P80 – P120',  note:'À la cale longue, en croisant les passes.' },
  { step:'Finition du mastic',                          grain:'P180 – P240', note:'Efface les rayures du P80 avant l’apprêt.' },
  { step:'Mastic fin / rebouchage des pores',           grain:'P320',        note:'Contrôle au guide de ponçage (poudre noire).' },
  { step:'Ponçage de l’apprêt garnissant (à sec)',      grain:'P400 – P500', note:'Orbitale 3 mm, aspiration branchée.' },
  { step:'Ponçage de l’apprêt (à l’eau)',               grain:'P600 – P800', note:'Sécher parfaitement avant peinture.' },
  { step:'Matage d’un vernis pour raccord',             grain:'P1000 + pad', note:'Ou tampon abrasif fin + pâte de matage.' },
  { step:'Dénibage d’un défaut dans le vernis',         grain:'P1500 – P2000', note:'À l’eau, sur cale souple, très localisé.' },
  { step:'Préparation au lustrage',                     grain:'P2500 – P3000', note:'Puis mousse + pâte abrasive, vitesse modérée.' }
];

async function viewTools(){
  setTitle('Outils d’atelier');
  setView(`
    <div class="crumb"><a href="#/">Parcours</a> <span>›</span> <span>Outils</span></div>
    <h1 style="font-size:1.7rem;letter-spacing:-.02em;margin-bottom:.4rem">Outils d’atelier</h1>
    <p class="muted" style="margin-bottom:1.6rem">Trois calculateurs qui servent tous les jours en cabine. Tout tourne côté navigateur.</p>

    <section class="tool">
      <h2>1. Calculateur de mélange 2K</h2>
      <p>Vous connaissez le ratio de la fiche technique et le volume de produit prêt à l’emploi dont vous avez besoin ? Le calculateur vous donne les quantités exactes à verser dans le godet.</p>
      <div class="grid2">
        <div class="field"><label for="t-vol">Volume total voulu (ml)</label><input id="t-vol" type="number" value="1000" min="50" step="50"></div>
        <div class="field"><label for="t-ratio">Ratio (base : durcisseur : diluant)</label>
          <select id="t-ratio">
            <option value="2,1,0">2 : 1 — vernis HS sans diluant</option>
            <option value="2,1,0.2" selected>2 : 1 + 10 % — vernis MS</option>
            <option value="4,1,0.5">4 : 1 + 10 % — apprêt garnissant</option>
            <option value="5,1,0.6">5 : 1 + 10 % — apprêt haute garniture</option>
            <option value="1,0,0.15">Base hydro + 15 % de diluant hydro</option>
            <option value="1,0,0.5">Base solvant 1K + 50 % de diluant</option>
          </select></div>
      </div>
      <div class="field"><label for="t-loss">Marge de perte (%) — godet, filtre, essais</label><input id="t-loss" type="number" value="10" min="0" max="40"></div>
      <div class="tool-out" id="t-out1"></div>
      <div class="note tip" style="margin-bottom:0"><svg class="ni" viewBox="0 0 24 24">${ICONS.tip}</svg>
        <div><b>Astuce d’atelier</b><p>Le ratio de la fiche technique prime toujours sur l’habitude. Un durcisseur sous-dosé ne
        polymérise jamais complètement : le vernis reste tendre, marque à l’ongle et jaunit.</p></div></div>
    </section>

    <section class="tool">
      <h2>2. Assistant grain de ponçage</h2>
      <p>Le principe : on ne saute jamais plus de deux graduations. Chaque grain doit effacer les rayures du précédent.</p>
      <div class="field"><label for="t-step">À quelle étape êtes-vous ?</label>
        <select id="t-step">${GRAINS.map((g, i) => `<option value="${i}">${esc(g.step)}</option>`).join('')}</select></div>
      <div class="tool-out" id="t-out2"></div>
    </section>

    <section class="tool">
      <h2>3. Diagnostic express d’un défaut de peinture</h2>
      <p>Décrivez ce que vous voyez sur l’élément : l’outil remonte la cause la plus probable et le remède.</p>
      <div class="field"><label for="t-def">Aspect du défaut</label><select id="t-def"></select></div>
      <div class="tool-out" id="t-out3"></div>
    </section>`);

  const out1 = $('#t-out1');
  const calc = () => {
    const v = Math.max(0, +$('#t-vol').value || 0) * (1 + (+$('#t-loss').value || 0) / 100);
    const [a, b, c] = $('#t-ratio').value.split(',').map(Number);
    const tot = a + b + c;
    const q = n => Math.round(v * n / tot);
    out1.innerHTML = `
      <div class="row"><span>Base / apprêt</span><b>${q(a)} ml</b></div>
      ${b ? `<div class="row"><span>Durcisseur</span><b>${q(b)} ml</b></div>` : ''}
      ${c ? `<div class="row"><span>Diluant</span><b>${q(c)} ml</b></div>` : ''}
      <div class="row"><span>Volume préparé (marge incluse)</span><b>${Math.round(v)} ml</b></div>`;
  };
  ['#t-vol', '#t-ratio', '#t-loss'].forEach(s => $(s).addEventListener('input', calc)); calc();

  const out2 = $('#t-out2');
  const g = () => {
    const x = GRAINS[+$('#t-step').value];
    const nx = GRAINS[+$('#t-step').value + 1];
    out2.innerHTML = `<div class="row"><span>Grain conseillé</span><b>${esc(x.grain)}</b></div>
      <div class="row"><span>Point de vigilance</span><span style="text-align:right;max-width:60%">${esc(x.note)}</span></div>
      ${nx ? `<div class="row"><span>Étape suivante</span><span style="text-align:right;max-width:60%">${esc(nx.step)} (${esc(nx.grain)})</span></div>` : ''}`;
  };
  $('#t-step').addEventListener('change', g); g();

  /* le diagnostic réutilise le tableau des défauts de la leçon 6.1 */
  const defauts = await json('data/defauts.json').catch(() => []);
  const sel = $('#t-def'), out3 = $('#t-out3');
  sel.innerHTML = defauts.map((d, i) => `<option value="${i}">${esc(d.aspect)}</option>`).join('');
  const d = () => {
    const x = defauts[+sel.value]; if (!x) return;
    out3.innerHTML = `<div class="row"><span>Défaut</span><b>${esc(x.nom)}</b></div>
      <div class="row"><span>Cause probable</span><span style="text-align:right;max-width:62%">${esc(x.cause)}</span></div>
      <div class="row"><span>Remède</span><span style="text-align:right;max-width:62%">${esc(x.remede)}</span></div>
      <div class="row"><span>Prévention</span><span style="text-align:right;max-width:62%">${esc(x.prevention)}</span></div>`;
  };
  sel.addEventListener('change', d); d();
}

/* ---- examen blanc ---- */
async function viewExam(){
  setTitle('Examen blanc');
  setView('<div class="loader"><i></i><i></i><i></i></div>');
  await loadAll();
  const pool = [];
  DB.flat.forEach(l => (DB.lessons.get(l.id)?.quiz || []).forEach(q => pool.push({ ...q, from:l.title, id:l.id })));
  const N = Math.min(15, pool.length);
  const qs = pool.map(v => [Math.random(), v]).sort((a, b) => a[0] - b[0]).slice(0, N).map(v => v[1]);

  setView(`
    <div class="crumb"><a href="#/">Parcours</a> <span>›</span> <span>Examen blanc</span></div>
    <h1 style="font-size:1.7rem;letter-spacing:-.02em">Examen blanc</h1>
    <p class="muted">${N} questions tirées au hasard dans l’ensemble du programme. Pas de chronomètre :
      prenez le temps de raisonner comme devant une voiture. Objectif de réussite : <strong>80 %</strong>.</p>
    <section class="quiz" id="exam" style="margin-top:1.4rem">
      <div class="quiz-head"><svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M8 10h8M8 14h5"/></svg>
        <b>Questions</b><span class="muted" data-qscore>0 / ${N}</span></div>
      ${qs.map((q, i) => `<div class="q" data-q="${i}" data-a="${q.answer}">
        <p>${i + 1}. ${md(q.q)}</p>
        <div class="opts">${q.choices.map((c, j) =>
          `<button class="opt" data-j="${j}"><span class="mark">${'ABCD'[j]}</span><span>${md(c)}</span></button>`).join('')}</div>
        <div class="why" role="status" hidden>${md(q.why || '')} <em style="opacity:.7">— ${esc(q.from)}</em></div></div>`).join('')}
    </section>
    <div id="exam-res"></div>`);

  let score = 0, ans = 0;
  $$('#exam .q').forEach(q => {
    const good = +q.dataset.a;
    $$('.opt', q).forEach(o => o.addEventListener('click', () => {
      if (q.dataset.locked) return;
      q.dataset.locked = '1';
      const j = +o.dataset.j;
      $$('.opt', q).forEach(x => x.classList.add('locked'));
      o.classList.add(j === good ? 'good' : 'bad');
      if (j !== good) $$('.opt', q)[good].classList.add('good');
      $('.why', q).hidden = false;
      if (j === good) score++;
      ans++;
      $('#exam [data-qscore]').textContent = `${score} / ${N}`;
      if (ans === N) finish(score, N);
    }));
  });

  function finish(s, n){
    const pct = Math.round(s / n * 100);
    if (pct > (P.bestExam || 0)) P.bestExam = pct;
    save(); addXP(XP_EXAM); checkBadges();
    const off = 333 - 333 * pct / 100;
    $('#exam-res').innerHTML = `<div class="hero" style="margin-top:1.4rem;text-align:center">
      <div class="score-ring"><svg viewBox="0 0 120 120">
        <circle class="b" cx="60" cy="60" r="53"/><circle class="f" cx="60" cy="60" r="53" style="stroke-dashoffset:${off};stroke:${pct >= 80 ? 'var(--acc2)' : pct >= 50 ? 'var(--acc3)' : 'var(--danger)'}"/>
      </svg><b>${pct}%</b></div>
      <h2 style="font-size:1.25rem">${pct >= 80 ? 'Excellent — niveau atelier atteint 🏆' : pct >= 50 ? 'Presque : revoyez les leçons concernées' : 'À retravailler — reprenez le parcours'}</h2>
      <p class="muted" style="margin:.5rem auto 0">Score : ${s}/${n} · Meilleur score : ${P.bestExam}%</p>
      <div class="hero-cta" style="justify-content:center">
        <button class="btn btn-primary" onclick="location.reload()">Refaire un tirage</button>
        <a class="btn btn-ghost" href="#/">Retour aux parcours</a></div></div>`;
    $('#exam-res').scrollIntoView({ behavior:'smooth', block:'center' });
  }
}

/* ---- glossaire ---- */
async function viewGlossary(){
  if (!DB.glossary) DB.glossary = await json('data/glossaire.json').catch(() => []);
  setTitle('Glossaire');
  const letters = [...new Set(DB.glossary.map(g => g.t[0].toUpperCase()))].sort();
  setView(`
    <div class="crumb"><a href="#/">Parcours</a> <span>›</span> <span>Glossaire</span></div>
    <h1 style="font-size:1.7rem;letter-spacing:-.02em">Glossaire du carrossier-peintre</h1>
    <p class="muted">${DB.glossary.length} termes que vous entendrez dès votre premier jour en atelier.</p>
    <div class="field" style="margin-top:1.2rem"><input id="gl-q" type="search" placeholder="Filtrer un terme…"></div>
    <div class="gl-letters">${letters.map(l => `<button data-l="${l}">${l}</button>`).join('')}</div>
    <div id="gl-list"></div>`);

  const list = $('#gl-list');
  let letter = '';
  const draw = () => {
    const q = norm($('#gl-q').value);
    const r = DB.glossary.filter(g =>
      (!letter || g.t[0].toUpperCase() === letter) &&
      (!q || norm(g.t).includes(q) || norm(g.d).includes(q)));
    list.innerHTML = r.length
      ? r.map(g => `<div class="gl-item"><b>${esc(g.t)}</b><p>${md(g.d)}</p></div>`).join('')
      : '<div class="empty">Aucun terme trouvé.</div>';
  };
  $('#gl-q').addEventListener('input', draw);
  $$('.gl-letters button').forEach(b => b.addEventListener('click', () => {
    letter = letter === b.dataset.l ? '' : b.dataset.l;
    $$('.gl-letters button').forEach(x => x.classList.toggle('on', x.dataset.l === letter));
    draw();
  }));
  draw();
}

const notFound = () => setView('<div class="empty">Page introuvable. <a class="link" href="#/">Retour à l’accueil</a></div>');

/* =========================================================================
   NAVIGATION / CHROME
   ========================================================================= */
function refreshChrome(){
  const s = stats();
  $('#xp-val').textContent = P.xp || 0;
  $('#global-bar').style.width = s.pct + '%';
  $('.global-progress').setAttribute('aria-valuenow', s.pct);
  $('#side-pct').textContent = s.pct + '%';
  $('#side-ring').style.strokeDashoffset = 119.4 - 119.4 * s.pct / 100;
  $('#side-sub').textContent = `${s.doneCount} / ${s.total} leçon${s.doneCount > 1 ? 's' : ''} terminée${s.doneCount > 1 ? 's' : ''}`;
  buildTree();
}

function buildTree(){
  const tree = $('#side-tree');
  if (!DB.curriculum) return;
  const cur = location.hash.replace('#/l/', '');
  tree.innerHTML = DB.curriculum.modules.map((m, i) => {
    const done = m.lessons.every(l => P.done[l.id]);
    const open = m.lessons.some(l => l.id === cur);
    return `<div class="tree-mod ${done ? 'done' : ''} ${open ? 'open' : ''}" data-m="${m.id}">
      <button aria-expanded="${open}"><span class="num">${done ? '✓' : i + 1}</span>${esc(m.short || m.title)}
        <svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
      <div class="tree-les">${m.lessons.map(l =>
        `<a href="#/l/${l.id}" class="${P.done[l.id] ? 'done' : ''} ${l.id === cur ? 'active' : ''}">
          <span class="dot"></span>${esc(l.title)}</a>`).join('')}</div></div>`;
  }).join('');
  $$('.tree-mod > button', tree).forEach(b => b.addEventListener('click', () => {
    const p = b.parentElement, o = p.classList.toggle('open');
    b.setAttribute('aria-expanded', o);
  }));
  $$('.tree-les a', tree).forEach(a => a.addEventListener('click', closeMenu));
}

const closeMenu = () => { $('#sidebar').classList.remove('open'); $('#scrim').hidden = true; $('#btn-menu').setAttribute('aria-expanded', 'false'); };

async function route(){
  const h = location.hash.slice(1) || '/';
  $$('.top-nav a').forEach(a => a.classList.toggle('active', a.dataset.nav === h.split('/').slice(0, 2).join('/')));
  try {
    if (h.startsWith('/l/'))       await viewLesson(h.slice(3));
    else if (h.startsWith('/m/'))  await viewModule(h.slice(3));
    else if (h === '/outils')      await viewTools();
    else if (h === '/examen')      await viewExam();
    else if (h === '/glossaire')   await viewGlossary();
    else                           await viewHome();
  } catch (e) {
    setView(`<div class="empty"><h2 style="font-size:1.1rem;margin-bottom:.5rem">Contenu inaccessible</h2>
      <p class="muted">${esc(e.message)}</p>
      <p class="muted" style="margin-top:.8rem">Si vous ouvrez le fichier directement depuis le disque,
      lancez un petit serveur local : <code>python3 -m http.server</code> puis ouvrez
      <code>http://localhost:8000/formation/</code>.</p></div>`);
  }
  refreshChrome();
  closeMenu();
  /* Ramène le focus en tête de contenu : sans cela, un utilisateur au clavier
     ou au lecteur d'écran reste sur <body> sans savoir que la page a changé. */
  if (!first) view.focus({ preventScroll:true });
  first = false;
}
let first = true;

/* ---------- recherche / palette ---------- */
let PAL = [], sel = 0;
async function buildIndex(){
  await getCurriculum();
  PAL = [
    { t:'Outils d’atelier', s:'Mélange 2K, grains, diagnostic', h:'#/outils', k:'outils calcul' },
    { t:'Examen blanc',     s:'15 questions au hasard',        h:'#/examen', k:'examen test qcm' },
    { t:'Glossaire',        s:'Le vocabulaire du métier',      h:'#/glossaire', k:'glossaire lexique' },
    ...DB.curriculum.modules.map(m => ({ t:m.title, s:'Parcours · ' + m.lessons.length + ' leçons', h:'#/m/' + m.id, k:m.summary })),
    ...DB.flat.map(l => ({ t:l.title, s:l.module.title, h:'#/l/' + l.id, k:(l.summary || '') + ' ' + (l.keywords || []).join(' ') }))
  ];
}

/* Enrichissement plein texte : déclenché à la PREMIÈRE ouverture de la recherche,
   jamais au démarrage — sinon la page d'accueil télécharge tout le programme. */
let deepIndexed = false;
async function deepenIndex(){
  if (deepIndexed) return;
  deepIndexed = true;
  await loadAll();
  DB.flat.forEach(l => {
    const L = DB.lessons.get(l.id); if (!L) return;
    const item = PAL.find(p => p.h === '#/l/' + l.id);
    if (item) item.k += ' ' + (L.blocks || []).map(b => b.x || b.title || (b.items || []).map(i => i.x || i.title || i.f || i).join(' ')).join(' ');
  });
  if (!$('#palette').hidden) palSearch($('#pal-q').value);
}
function palSearch(q){
  const n = norm(q);
  const box = $('#pal-results');
  const r = !n ? PAL.slice(0, 8) : PAL.filter(p => norm(p.t + ' ' + p.s + ' ' + p.k).includes(n)).slice(0, 20);
  sel = 0;
  box.innerHTML = r.length ? r.map((p, i) => `<button class="pal-item ${i ? '' : 'sel'}" data-h="${p.h}">
      <span class="ico"><svg viewBox="0 0 24 24"><path d="M4 5h16M4 12h16M4 19h10"/></svg></span>
      <span style="min-width:0"><b>${esc(p.t)}</b><span>${esc(p.s)}</span></span></button>`).join('')
    : '<div class="pal-empty">Aucun résultat. Essayez « coulure », « teinte », « MIG »…</div>';
  $$('.pal-item', box).forEach(b => b.addEventListener('click', () => { location.hash = b.dataset.h; closePal(); }));
}
const openPal  = () => { $('#palette').hidden = false; $('#pal-q').value = ''; palSearch(''); $('#pal-q').focus(); deepenIndex(); };
const closePal = () => { $('#palette').hidden = true; };

/* ---------- démarrage ---------- */
function boot(){
  /* thème */
  const savedTheme = localStorage.getItem('cp-theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  else if (matchMedia('(prefers-color-scheme: light)').matches) document.documentElement.dataset.theme = 'light';
  $('#btn-theme').addEventListener('click', () => {
    const t = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    try { localStorage.setItem('cp-theme', t); } catch {}
  });

  /* menu mobile */
  $('#btn-menu').addEventListener('click', () => {
    const o = $('#sidebar').classList.toggle('open');
    $('#scrim').hidden = !o; $('#btn-menu').setAttribute('aria-expanded', o);
  });
  $('#scrim').addEventListener('click', closeMenu);

  /* recherche */
  $('#btn-search').addEventListener('click', openPal);
  $('#pal-q').addEventListener('input', e => palSearch(e.target.value));
  $('#palette').addEventListener('click', e => { if (e.target.id === 'palette') closePal(); });

  /* données locales */
  $('#btn-export').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(P, null, 2)], { type:'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'progression-carrossier-peintre.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#btn-reset').addEventListener('click', () => {
    if (!confirm('Effacer toute votre progression ? Cette action est définitive.')) return;
    P = blank(); save(); refreshChrome(); route(); toast('Progression réinitialisée');
  });

  /* clavier */
  addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); $('#palette').hidden ? openPal() : closePal(); return; }
    if (e.key === 'Escape') { closePal(); closeMenu(); return; }
    if (!$('#palette').hidden) {
      const items = $$('.pal-item');
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach((it, i) => it.classList.toggle('sel', i === sel));
        items[sel]?.scrollIntoView({ block:'nearest' });
      }
      if (e.key === 'Enter') items[sel]?.click();
      return;
    }
    if (e.target.matches('input,select,textarea')) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const cur = location.hash.replace('#/l/', '');
      const i = (DB.flat || []).findIndex(l => l.id === cur);
      if (i < 0) return;
      const n = DB.flat[i + (e.key === 'ArrowRight' ? 1 : -1)];
      if (n) location.hash = '#/l/' + n.id;
    }
  });

  addEventListener('hashchange', route);
  buildIndex().then(route).catch(route);

  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
boot();
})();
