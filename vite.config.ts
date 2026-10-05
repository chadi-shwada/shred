import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { PUBLIC_PAGES, SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from './src/config';
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

const escapeAttr = (text: string) => text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

/** Titre, description, aperçus de partage (Open Graph, X), robots.txt et sitemap.xml. */
function seo(): Plugin {
  const image = `${SITE_URL}/og.png`;
  const tags = [
    `<title>${SITE_TITLE}</title>`,
    `<meta name="description" content="${escapeAttr(SITE_DESCRIPTION)}" />`,
    `<link rel="canonical" href="${SITE_URL}/" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:locale" content="fr_FR" />`,
    `<meta property="og:site_name" content="Shred" />`,
    `<meta property="og:title" content="${escapeAttr(SITE_TITLE)}" />`,
    `<meta property="og:description" content="${escapeAttr(SITE_DESCRIPTION)}" />`,
    `<meta property="og:url" content="${SITE_URL}/" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="Shred : demande l'effacement de tes données" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(SITE_TITLE)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(SITE_DESCRIPTION)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ].join('\n    ');
  return {
    name: 'shred-seo',
    transformIndexHtml(html) {
      return html.replace('<!-- shred:seo -->', tags);
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      });
      const urls = PUBLIC_PAGES.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`).join('\n');
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      });
    },
  };
}

export default defineConfig({
  // Chemins absolus : les pages ont de vraies adresses (/lettre, /verifier…).
  base: '/',
  plugins: [react(), csp(), seo()],
  build: {
    // Pas de fichiers intégrés en data: : la CSP n'autorise que font-src 'self'.
    assetsInlineLimit: 0,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
