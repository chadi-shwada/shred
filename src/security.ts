/**
 * Politique de sécurité du contenu (CSP), source unique.
 *
 * connect-src 'none' garantit qu'aucune requête réseau ne part de la page :
 * c'est la règle n° 1 du projet, appliquée par le navigateur.
 *
 * - CSP_META est injectée dans index.html au build (vite.config.ts).
 * - CSP_HEADER est envoyée en en-tête HTTP par Vercel (vercel.json) ; elle ajoute
 *   frame-ancestors, que les navigateurs ignorent dans une balise <meta>.
 * security.test.ts vérifie que vercel.json reste aligné.
 */

const DIRECTIVES = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "form-action 'none'",
  "base-uri 'none'",
  "object-src 'none'",
];

export const CSP_META = DIRECTIVES.join('; ');

export const CSP_HEADER = [...DIRECTIVES, "frame-ancestors 'none'"].join('; ');
