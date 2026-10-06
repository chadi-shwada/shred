/**
 * Lancé après « vite build » : écrit le contenu de chaque page dans son fichier HTML de dist/
 * (index.html, verifier.html, fuite/free.html…), à la place de <div id="root"></div>.
 * Le rendu vient du code du site (src/prerender.tsx), chargé par Vite.
 * Le suivi (/suivi) n'est pas pré-rendu : son contenu dépend du navigateur de la personne.
 * Les attributs style sont retirés : la CSP les bloquerait (et le signalerait dans la console).
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const EMPTY_ROOT = '<div id="root"></div>';
const SKIP = new Set(['suivi.html']);

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return name === 'assets' ? [] : htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

/** « index.html » → « / », « fuite/free.html » → « /fuite/free », « 404.html » → une adresse inconnue. */
function pathOf(file) {
  const rel = relative(dist, file).replace(/\\/g, '/').replace(/\.html$/, '');
  if (rel === 'index') return '/';
  if (rel === '404') return '/page-introuvable';
  return `/${rel}`;
}

const vite = await createServer({ root, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { renderPage } = await vite.ssrLoadModule('/src/prerender.tsx');
  let count = 0;
  for (const file of htmlFiles(dist)) {
    if (SKIP.has(relative(dist, file))) continue;
    const html = readFileSync(file, 'utf8');
    if (!html.includes(EMPTY_ROOT)) throw new Error(`${relative(dist, file)} : ${EMPTY_ROOT} introuvable`);
    // Sans attributs style : la CSP (style-src 'self') les bloque dans le HTML. L'application les
    // remet en place au chargement (styles posés par JavaScript, autorisés).
    const body = (await renderPage(pathOf(file))).replace(/ style="[^"]*"/g, '');
    writeFileSync(file, html.replace(EMPTY_ROOT, `<div id="root">${body}</div>`));
    count += 1;
  }
  console.log(`[prerender] ${count} pages pré-rendues`);
} finally {
  await vite.close();
}
