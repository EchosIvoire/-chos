#!/usr/bin/env node
/* =========================================================================
   Contrôle qualité du site — une seule commande, en local comme en CI.

     node scripts/audit.mjs           audit complet (Lighthouse + axe-core)
     node scripts/audit.mjs --fast    sans navigateur : fraîcheur du build seule
     node scripts/audit.mjs --json r.json   écrit le rapport détaillé

   Sort en code 1 si un seuil de scripts/quality-budget.json n'est pas tenu,
   ou si les pages statiques ne sont plus à jour avec les JSON de contenu.
   ========================================================================= */
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile, writeFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(import.meta.url), '../..');
const args = process.argv.slice(2);
const FAST = args.includes('--fast');
const JSON_OUT = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;

const C = { ok:'\x1b[32m', ko:'\x1b[31m', warn:'\x1b[33m', dim:'\x1b[2m', off:'\x1b[0m', b:'\x1b[1m' };
const say = (...m) => console.log(...m);

/* ---------- 1. Fraîcheur des pages générées ---------- */
async function checkBuild(){
  say(`${C.b}▸ Fraîcheur des pages statiques${C.off}`);
  try {
    execFileSync('node', [join(ROOT, 'formation/build.mjs')], { cwd: ROOT, stdio:'pipe' });
  } catch (e) {
    say(`  ${C.ko}✗ formation/build.mjs a échoué${C.off}\n${e.stderr?.toString() || e.message}`);
    return false;
  }
  let dirty = '';
  try {
    dirty = execFileSync('git', ['status', '--porcelain', 'formation/lecons', 'sitemap.xml'],
                         { cwd: ROOT }).toString().trim();
  } catch { /* hors dépôt git : on ne peut pas comparer */ return true; }
  if (dirty) {
    say(`  ${C.ko}✗ les pages générées ne correspondent plus aux JSON de contenu${C.off}`);
    dirty.split('\n').forEach(l => say(`      ${l}`));
    say(`  ${C.dim}→ lancez « npm run build » et committez le résultat${C.off}`);
    return false;
  }
  say(`  ${C.ok}✓ à jour${C.off}`);
  return true;
}

/* ---------- 2. Serveur statique local ---------- */
const MIME = { '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'text/javascript; charset=utf-8', '.mjs':'text/javascript; charset=utf-8',
  '.json':'application/json; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png',
  '.webmanifest':'application/manifest+json', '.xml':'application/xml', '.txt':'text/plain; charset=utf-8' };

function serve(){
  return new Promise(resolve => {
    const srv = createServer(async (req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0].split('#')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const file = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
      try {
        if (!(await stat(file)).isFile()) throw new Error('dir');
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
        createReadStream(file).pipe(res);
      } catch { res.writeHead(404).end('404'); }
    });
    srv.listen(0, '127.0.0.1', () => resolve({ srv, port: srv.address().port }));
  });
}

/* ---------- 3. Lighthouse ---------- */
function lighthouse(url, chromePath){
  return new Promise(resolve => {
    const out = [];
    const lh = spawn('npx', ['--no-install', 'lighthouse', url, '--quiet', '--output=json', '--output-path=stdout',
      '--chrome-flags=--headless=new --no-sandbox --disable-dev-shm-usage'],
      { cwd: ROOT, env: { ...process.env, CHROME_PATH: chromePath || process.env.CHROME_PATH || '' } });
    lh.stdout.on('data', d => out.push(d));
    lh.on('close', () => {
      try { resolve(JSON.parse(Buffer.concat(out).toString())); }
      catch { resolve(null); }
    });
  });
}

/* ---------- 4. axe-core ---------- */
async function axeRun(pages, port){
  const { chromium } = await import('playwright');
  const axe = await readFile(join(ROOT, 'node_modules/axe-core/axe.min.js'), 'utf8');
  // CHROME_PATH, quand il est défini, pointe un navigateur déjà présent sur la machine :
  // cela évite d'exiger le build exact que la version locale de Playwright téléchargerait.
  // En CI, la variable n'est pas définie et `npx playwright install chromium` fournit le bon.
  const browser = await chromium.launch(
    process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const results = {};
  for (const scheme of ['light', 'dark']) {
    const page = await browser.newPage({ colorScheme: scheme, viewport:{ width:1280, height:900 } });
    for (const p of pages) {
      await page.goto(`http://127.0.0.1:${port}${p.url}`, { waitUntil:'networkidle' }).catch(() => {});
      await page.waitForTimeout(500);
      await page.evaluate(axe);
      const r = await page.evaluate(async () => await axe.run(document,
        { runOnly:{ type:'tag', values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa'] } }));
      const key = p.url;
      results[key] ??= [];
      for (const v of r.violations) {
        for (const n of v.nodes) {
          const d = n.any?.[0]?.data || {};
          results[key].push({ scheme, id:v.id, impact:v.impact,
            detail: d.contrastRatio ? `${d.fgColor} sur ${d.bgColor} = ${d.contrastRatio}` : n.html.slice(0, 90) });
        }
      }
    }
    await page.close();
  }
  await browser.close();
  return results;
}

/* ---------- exécution ---------- */
const budget = JSON.parse(await readFile(join(ROOT, 'scripts/quality-budget.json'), 'utf8'));
let ok = await checkBuild();

if (FAST) {
  say(`\n${C.dim}Mode rapide : Lighthouse et axe-core non exécutés.${C.off}`);
  process.exit(ok ? 0 : 1);
}

const { srv, port } = await serve();
const report = { date:new Date().toISOString(), pages:{} };

say(`\n${C.b}▸ axe-core (WCAG 2.2 AA, thèmes clair et sombre)${C.off}`);
const axeRes = await axeRun(budget.pages, port);
for (const p of budget.pages) {
  const v = axeRes[p.url] || [];
  report.pages[p.url] = { nom:p.nom, axe:v.length };
  if (v.length > budget.axeViolations) {
    ok = false;
    say(`  ${C.ko}✗ ${p.nom} — ${v.length} violation(s)${C.off}`);
    [...new Map(v.map(x => [x.id + x.detail, x])).values()].slice(0, 4)
      .forEach(x => say(`      ${C.dim}[${x.scheme}/${x.impact}] ${x.id} — ${x.detail}${C.off}`));
  } else say(`  ${C.ok}✓ ${p.nom}${C.off}`);
}

say(`\n${C.b}▸ Lighthouse (mobile)${C.off}`);
const chrome = process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
say(`  ${'Page'.padEnd(22)} ${'perf'.padEnd(6)} ${'a11y'.padEnd(6)} ${'bonnes'.padEnd(7)} seo`);
for (const p of budget.pages.filter(x => !x.axeOnly)) {
  const lh = await lighthouse(`http://127.0.0.1:${port}${p.url}`, chrome);
  if (!lh) { say(`  ${C.warn}? ${p.nom} — Lighthouse n'a pas répondu${C.off}`); continue; }
  const s = Object.fromEntries(Object.entries(lh.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
  const seuils = { ...budget.categories, ...(p.seo !== undefined ? { seo:p.seo } : {}) };
  const bad = Object.entries(seuils).filter(([k, min]) => (s[k] ?? 100) < min);
  report.pages[p.url] = { ...report.pages[p.url], ...s };
  const mark = bad.length ? `${C.ko}✗` : `${C.ok}✓`;
  say(`  ${mark} ${p.nom.padEnd(20)} ${String(s.performance).padEnd(6)} ${String(s.accessibility).padEnd(6)} ${String(s['best-practices']).padEnd(7)} ${s.seo}${C.off}`);
  if (bad.length) { ok = false; bad.forEach(([k, min]) => say(`      ${C.dim}${k} : ${s[k]} < ${min} attendu${C.off}`)); }
}

srv.close();
if (JSON_OUT) await writeFile(JSON_OUT, JSON.stringify(report, null, 2));
say(`\n${ok ? C.ok + '✓ Tous les seuils sont tenus.' : C.ko + '✗ Contrôle qualité en échec.'}${C.off}`);
process.exit(ok ? 0 : 1);
