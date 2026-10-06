import { existsSync, readFileSync } from 'node:fs';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { SITE_URL } from './src/config';
import { allBreachPageMeta, breachFeed, catalogSummary } from './src/lib/breachPages';
import { EMPTY_CATALOG, parseCatalog, type BreachCatalog } from './src/lib/breaches';
import { headTags, htmlFileName, NOT_FOUND, pageMeta, PAGES, robotsTxt, sitemapXml } from './src/seo';
import { CSP_META } from './src/security';

// CSP appliquée au build seulement (le serveur de dev a besoin de scripts en ligne).
// Source unique : src/security.ts.

function csp(): Plugin {
  return {
    name: 'shred-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP_META}" />`,
      );
    },
  };
}

const SEO_MARKER = '<!-- shred:seo -->';

/** Catalogue HIBP téléchargé par prebuild (scripts/fetch-breaches.mjs) ; vide s'il manque. */
function readCatalog(): BreachCatalog {
  const file = new URL('./src/data/breaches.generated.json', import.meta.url);
  if (!existsSync(file)) return EMPTY_CATALOG;
  try {
    return parseCatalog(JSON.parse(readFileSync(file, 'utf8')));
  } catch {
    return EMPTY_CATALOG;
  }
}

const SUMMARY_ID = 'virtual:catalog-summary';

/**
 * Module virtuel « virtual:catalog-summary » : quelques chiffres et les dernières
 * fuites françaises pour l'accueil, sans charger tout le catalogue.
 */
function catalogSummaryModule(): Plugin {
  return {
    name: 'shred-catalog-summary',
    resolveId: (id) => (id === SUMMARY_ID ? `\0${SUMMARY_ID}` : null),
    load: (id) =>
      id === `\0${SUMMARY_ID}` ? `export default ${JSON.stringify(catalogSummary(readCatalog()))};` : null,
  };
}

/**
 * Une page HTML par adresse (index.html, verifier.html…) avec son titre, sa
 * description, son adresse canonique et son aperçu de partage, plus 404.html
 * (non indexée), robots.txt et sitemap.xml, plus une page par fuite française
 * (fuite/free.html…) et le flux Atom fuites.xml, tirés du catalogue HIBP. Vercel sert verifier.html sur
 * /verifier grâce à cleanUrls (vercel.json). Source : src/seo.ts.
 */
function seo(): Plugin {
  return {
    name: 'shred-seo',
    enforce: 'post',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        // En développement, l'accueil ; au build, le marqueur reste pour generateBundle.
        return ctx.server ? html.replace(SEO_MARKER, headTags(pageMeta('/'))) : html;
      },
    },
    generateBundle(_options, bundle) {
      const index = bundle['index.html'];
      if (!index || index.type !== 'asset' || typeof index.source !== 'string') {
        this.error('index.html introuvable dans le bundle');
      }
      const template = index.source as string;
      if (!template.includes(SEO_MARKER)) this.error('marqueur SEO absent de index.html');
      const catalog = readCatalog();
      // Image d'aperçu par fuite si scripts/og-images.mjs l'a générée ; sinon og.png.
      const breachPages = allBreachPageMeta(catalog.breaches).map((page) => {
        const image = `/og/${page.path.slice('/fuite/'.length)}.jpg`;
        return existsSync(new URL(`./public${image}`, import.meta.url)) ? { ...page, image } : page;
      });
      for (const page of [...PAGES, ...breachPages]) {
        const html = template.replace(SEO_MARKER, headTags(page));
        if (page.path === '/') index.source = html;
        else this.emitFile({ type: 'asset', fileName: htmlFileName(page), source: html });
      }
      this.emitFile({
        type: 'asset',
        fileName: '404.html',
        source: template.replace(SEO_MARKER, headTags(NOT_FOUND, { noindex: true })),
      });
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt() });
      this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(breachPages) });
      if (catalog.breaches.length > 0) {
        this.emitFile({ type: 'asset', fileName: 'fuites.xml', source: breachFeed(catalog, SITE_URL) });
      }
    },
  };
}

export default defineConfig({
  // Chemins absolus : les pages ont de vraies adresses (/lettre, /verifier…).
  base: '/',
  plugins: [react(), csp(), catalogSummaryModule(), seo()],
  build: {
    // Pas de fichiers intégrés en data: : la CSP n'autorise que font-src 'self'.
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
