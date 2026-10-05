import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/*
 * Politique de sécurité du contenu, appliquée au build seulement
 * (le serveur de dev a besoin de scripts en ligne).
 * connect-src 'none' garantit qu'aucune requête réseau ne part de la page :
 * c'est la règle n° 1 du projet, vérifiée par le navigateur.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
].join('; ');

function csp(): Plugin {
  return {
    name: 'shred-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig({
  // Chemins relatifs : le site marche sur GitHub Pages quel que soit le nom du dépôt.
  base: './',
  plugins: [react(), csp()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
