#!/usr/bin/env node
/* Hook SessionStart : décrit l'état du dépôt à la session qui démarre.
   Lecture seule et rapide — aucun build, aucune installation déclenchée ici. */
import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const mtimeMax = async dir => {
  let max = 0;
  const walk = async d => {
    for (const e of await readdir(d, { withFileTypes:true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else max = Math.max(max, (await stat(p)).mtimeMs);
    }
  };
  try { await walk(dir); } catch { return 0; }
  return max;
};

const lignes = [];
try {
  const data = await mtimeMax(join(ROOT, 'formation/data'));
  const gen  = await mtimeMax(join(ROOT, 'formation/lecons'));
  if (data && gen && data > gen)
    lignes.push('ATTENTION : formation/data/ est plus récent que formation/lecons/. Lancez `npm run build` puis committez le résultat.');
  else if (data && gen)
    lignes.push('Les pages statiques de formation/lecons/ sont à jour.');

  lignes.push(existsSync(join(ROOT, 'node_modules'))
    ? 'Outillage d\'audit installé : `npm run audit` est utilisable.'
    : 'Outillage d\'audit absent : lancez `npm ci` avant `npm run audit`.');
} catch { /* dépôt incomplet : on n'ajoute rien */ }

if (lignes.length) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName:'SessionStart', additionalContext: lignes.join('\n') }
  }));
}
