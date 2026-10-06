/**
 * Génère une image d'aperçu (1200×630, JPEG) par page de fuite dans public/og/,
 * pour les partages (« Fuite Free : que faire ? »). Les réseaux sociaux
 * n'acceptent que des images matricielles : on rend une page HTML avec
 * Chromium (Playwright) puis on la capture.
 *
 * À lancer à la main, après un build qui a téléchargé le catalogue :
 *   CHROMIUM_PATH=/chemin/vers/chrome node scripts/og-images.mjs
 * Les fuites sans image gardent public/og.png (vite.config.ts vérifie).
 * Écrit aussi public/og/marks.json (position du médaillon) : au build,
 * scripts/og-logos.mjs y colle le logo de l'entreprise s'il est disponible.
 * Métadonnées publiques du catalogue HIBP seulement ; aucune personne.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}public/og`;
mkdirSync(out, { recursive: true });

// Charge la logique du site (TypeScript) via Vite, sans la dupliquer.
const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { breachSlugs, pageBreaches } = await vite.ssrLoadModule('/src/lib/breachPages.ts');
const { parseCatalog, dataClassLabel, formatCount } = await vite.ssrLoadModule('/src/lib/breaches.ts');
const { breachRisk, RISK_LABELS } = await vite.ssrLoadModule('/src/lib/risk.ts');
const { formatLongFr } = await vite.ssrLoadModule('/src/lib/dates.ts');
const { SITE_URL } = await vite.ssrLoadModule('/src/config.ts');
await vite.close();

const catalog = parseCatalog(JSON.parse(readFileSync(`${root}src/data/breaches.generated.json`, 'utf8')));
// Polices intégrées en data: (une page créée par setContent ne lit pas les fichiers locaux).
const font = (pkg, file) =>
  `data:font/woff2;base64,${readFileSync(`${root}node_modules/@fontsource-variable/${pkg}/files/${file}`).toString('base64')}`;
const logo = readFileSync(`${root}public/favicon.svg`, 'utf8');
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function hue(text) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.codePointAt(0)) % 360;
  return h;
}

const RISK_COLORS = { eleve: ['#2c1215', '#ff7a80'], moyen: ['#2b2110', '#f2b65a'], faible: ['#0f251b', '#5fd39a'] };

function page(breach, slug) {
  const risk = breachRisk(breach.dataClasses);
  const [riskBg, riskFg] = RISK_COLORS[risk];
  const h = hue(breach.title);
  const chips = breach.dataClasses.slice(0, 5).map((dc) => `<span class="chip">${esc(dataClassLabel(dc))}</span>`);
  if (breach.dataClasses.length > 5) chips.push(`<span class="chip">+${breach.dataClasses.length - 5}</span>`);
  const facts = [formatLongFr(breach.date), breach.pwnCount > 0 ? `${formatCount(breach.pwnCount)} comptes` : null]
    .filter(Boolean)
    .join(' · ');
  const title = breach.title.length > 22 ? 'is-long' : '';
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
@font-face{font-family:Inter;src:url(${font('inter', 'inter-latin-wght-normal.woff2')}) format('woff2');font-weight:100 900}
@font-face{font-family:'JB Mono';src:url(${font('jetbrains-mono', 'jetbrains-mono-latin-wght-normal.woff2')}) format('woff2');font-weight:100 900}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Inter;color:#f4f5fb;
background:radial-gradient(ellipse 70% 80% at 85% 0%,rgba(47,75,220,.45),transparent 60%),radial-gradient(ellipse 50% 60% at 0% 100%,rgba(47,75,220,.18),transparent 70%),#05060b;padding:56px 64px;display:flex;flex-direction:column}
.top{display:flex;align-items:center;gap:16px;font-size:30px;font-weight:700;letter-spacing:-.02em}
.top svg{width:48px;height:48px}
.top .rgpd{color:#8f9dff}
.eyebrow{margin-top:44px;font:600 20px 'JB Mono';letter-spacing:.1em;text-transform:uppercase;color:#8f9dff}
.head{display:flex;align-items:center;gap:28px;margin-top:14px}
.mark{width:104px;height:104px;border-radius:28px;display:grid;place-items:center;font-size:56px;font-weight:800;color:#fff;
background:linear-gradient(145deg,hsl(${h} 60% 34%),hsl(${h + 30} 55% 24%));box-shadow:inset 0 0 0 2px hsl(${h} 70% 60% / 35%)}
h1{font-size:84px;line-height:1;font-weight:800;letter-spacing:-.045em}
h1.is-long{font-size:60px}
.facts{margin-top:26px;display:flex;align-items:center;gap:20px;font:500 26px 'JB Mono';color:#c9cde0}
.risk{font:700 22px 'JB Mono';padding:8px 18px;border-radius:999px;background:${riskBg};color:${riskFg}}
.chips{margin-top:24px;display:flex;flex-wrap:wrap;gap:10px}
.chip{font:600 20px 'JB Mono';padding:8px 14px;border-radius:10px;border:1px solid rgba(143,157,255,.35);background:rgba(47,75,220,.14);color:#c4ccff}
.foot{margin-top:auto;display:flex;justify-content:space-between;align-items:center;gap:32px;font-size:24px;color:#aab0c4}
.foot b{color:#f4f5fb}
.url{font:600 22px 'JB Mono';color:#8f9dff;white-space:nowrap;flex:none}
</style></head><body>
<div class="top">${logo}<span>Shred<span class="rgpd">RGPD</span></span></div>
<div class="eyebrow">Fuite de données · que faire ?</div>
<div class="head"><div class="mark">${esc(breach.title.charAt(0).toUpperCase())}</div><h1 class="${title}">Fuite ${esc(breach.title)}</h1></div>
<div class="facts"><span>${esc(facts)}</span><span class="risk">● ${RISK_LABELS[risk]}</span></div>
<div class="chips">${chips.join('')}</div>
<div class="foot"><span><b>Demande l'effacement</b> : lettre RGPD gratuite, sans compte.</span><span class="url">${esc(SITE_URL.replace(/^https:\/\//, ''))}</span></div>
</body></html>`;
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const tab = await browser.newPage({ viewport: { width: 1200, height: 630 } });
let n = 0;
// Position du médaillon dans chaque image : scripts/og-logos.mjs y colle le logo au build.
const marks = {};
for (const [slug, breach] of breachSlugs(pageBreaches(catalog.breaches))) {
  await tab.setContent(page(breach, slug), { waitUntil: 'load' });
  await tab.evaluate(() => document.fonts.ready);
  writeFileSync(`${out}/${slug}.jpg`, await tab.screenshot({ type: 'jpeg', quality: 86 }));
  const box = await tab.locator('.mark').boundingBox();
  marks[slug] = {
    name: breach.name,
    x: Math.round(box.x),
    y: Math.round(box.y),
    size: Math.round(box.width),
    radius: 28,
  };
  n++;
}
writeFileSync(`${out}/marks.json`, JSON.stringify(marks, null, 2) + '\n');
await browser.close();
console.log(`[og-images] ${n} images dans public/og/ (catalogue du ${catalog.fetchedOn ?? 'inconnu'}).`);
