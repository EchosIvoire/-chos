# Skills du projet

Skills tierces installées au niveau du dépôt : Claude Code les découvre
automatiquement au démarrage d'une session ouverte sur ce projet, et elles se
déclenchent d'après leur champ `description`. Elles servent surtout à
l'e-formation (`/formation/`) et aux pages statiques du site.

| Skill | Se déclenche sur | Source | Licence |
|---|---|---|---|
| `web-quality-audit` | « audite le site », « revue qualité », « lighthouse » | [addyosmani/web-quality-skills](https://github.com/addyosmani/web-quality-skills) | MIT |
| `accessibility` | « audit a11y », « WCAG », « navigation clavier », « lecteur d'écran » | idem | MIT |
| `performance` | « optimise les perfs », « site lent », « temps de chargement » | idem | MIT |
| `core-web-vitals` | « LCP », « CLS », « INP », « Core Web Vitals » | idem | MIT |
| `seo` | « SEO », « données structurées », « balises meta », « sitemap » | idem | MIT |
| `best-practices` | « bonnes pratiques », « audit sécurité », « qualité de code » | idem | MIT |
| `webapp-testing` | tester une app web locale avec Playwright, captures, logs navigateur | [anthropics/skills](https://github.com/anthropics/skills) | Apache-2.0 |
| `frontend-design` | direction visuelle, typographie, éviter les rendus « générés par IA » | idem | Apache-2.0 |

## Pourquoi celles-ci

L'app `/formation/` est un site **statique en JS vanilla** : pas de framework,
pas de build. Les skills retenues sont toutes *stack-agnostic* et fonctionnent
sur du HTML/CSS/JS brut. Celles orientées React/Next/Vue ont été écartées.

Les skills `web-quality-*` fonctionnent en mode dégradé sans Chrome DevTools MCP
ni Lighthouse installé : elles retombent sur l'inspection statique des sources et
sur un pilotage navigateur classique (Playwright, déjà présent dans l'environnement).

## Vérification effectuée avant installation

- lecture intégrale du seul script shell embarqué (`web-quality-audit/scripts/analyze.sh`) :
  lecture seule, `set -euo pipefail`, aucune écriture, aucun appel réseau ;
- audit de `webapp-testing/scripts/with_server.py` : lance un serveur de dev local
  passé en argument, aucune connexion sortante ;
- recherche de motifs d'exfiltration ou d'injection de consignes
  (`api_key`, `.env`, `curl | sh`, `eval`, « ignore previous ») : aucun résultat ;
- aucune installation de dépendance déclenchée à l'exécution.

## Mise à jour

Les skills sont **vendorisées** (copiées), pas liées en sous-module : elles ne
bougeront pas toutes seules. Pour les mettre à jour, recloner la source et
recopier le dossier concerné.

## Licences

Chaque dossier embarque sa licence (`LICENSE` ou `LICENSE.txt`).
MIT © Addy Osmani · Apache-2.0 © Anthropic. Les fichiers sont redistribués sans
modification.
