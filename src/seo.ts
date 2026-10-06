/**
 * Métadonnées de chaque page : titre, description, adresse canonique et
 * aperçu de partage. Utilisé au build (vite.config.ts) pour générer une page
 * HTML par adresse, et dans le navigateur pour le titre de l'onglet.
 */

import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL } from './config';

export interface PageMeta {
  path: string;
  title: string;
  description: string;
  /** Image d'aperçu propre à la page (chemin depuis la racine) ; sinon /og.png. */
  image?: string;
}

export const PAGES: PageMeta[] = [
  { path: '/', title: SITE_TITLE, description: SITE_DESCRIPTION },
  {
    path: '/verifier',
    title: 'Vérifier mes fuites · ShredRGPD',
    description:
      "Repère les fuites qui contiennent ton e-mail, vois quelles données sont exposées et teste un mot de passe sans le confier à personne. Puis écris à l'entreprise en un clic.",
  },
  {
    path: '/que-faire',
    title: 'Que faire après une fuite ? · ShredRGPD',
    description:
      'SMS, appel ou e-mail suspect, carte bancaire, pièce d’identité ou mot de passe exposé : les bons réflexes et les canaux officiels de signalement.',
  },
  {
    path: '/lettre',
    title: 'Écrire une lettre RGPD · ShredRGPD',
    description:
      "Génère une lettre d'effacement, d'accès, d'opposition, de relance ou un signalement à l'hébergeur, avec les bons articles du RGPD. Gratuit, dans ton navigateur.",
  },
  {
    path: '/suivi',
    title: 'Suivi de mes demandes · ShredRGPD',
    description:
      "Suis tes demandes RGPD : échéance d'un mois calculée, rappel dans ton agenda, relance et récapitulatif de plainte CNIL. Tout reste dans ton navigateur.",
  },
  {
    path: '/ressources',
    title: 'Mes droits, étape par étape · ShredRGPD',
    description:
      "Comment faire effacer tes données après une fuite : preuves, bon contact, envoi, relance, signalement à l'hébergeur et plainte à la CNIL.",
  },
  {
    path: '/a-propos',
    title: 'À propos · ShredRGPD',
    description:
      'ShredRGPD aide les victimes de fuites de données à exercer leurs droits RGPD, sans compte, sans traceur et sans base de fuites.',
  },
  {
    path: '/mentions-legales',
    title: 'Mentions légales · ShredRGPD',
    description: 'Éditeur, hébergeur et traitement des données du site ShredRGPD.',
  },
];

export const NOT_FOUND: PageMeta = {
  path: '/404',
  title: 'Page introuvable · ShredRGPD',
  description: "Cette page n'existe pas.",
};

export function pageMeta(path: string): PageMeta {
  return PAGES.find((p) => p.path === path) ?? NOT_FOUND;
}

/** Nom du fichier HTML généré pour une page (« /verifier » → « verifier.html »). */
export function htmlFileName(page: PageMeta): string {
  return page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`;
}

const esc = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Balises <head> d'une page. La page 404 n'a pas d'adresse canonique et n'est pas indexée. */
export function headTags(page: PageMeta, { noindex = false } = {}): string {
  const url = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
  const image = `${SITE_URL}${page.image ?? '/og.png'}`;
  const imageAlt = page.image ? page.title : "ShredRGPD : demande l'effacement de tes données";
  const tags = [
    `<title>${esc(page.title)}</title>`,
    `<meta name="description" content="${esc(page.description)}" />`,
    noindex ? '<meta name="robots" content="noindex" />' : `<link rel="canonical" href="${url}" />`,
    '<meta property="og:type" content="website" />',
    '<meta property="og:locale" content="fr_FR" />',
    '<meta property="og:site_name" content="ShredRGPD" />',
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    ...(noindex ? [] : [`<meta property="og:url" content="${url}" />`]),
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    `<meta property="og:image:alt" content="${esc(imageAlt)}" />`,
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${esc(page.title)}" />`,
    `<meta name="twitter:description" content="${esc(page.description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    `<link rel="alternate" type="application/atom+xml" title="Fuites de données en France" href="/fuites.xml" />`,
  ];
  return tags.join('\n    ');
}

/** Plan du site : les pages fixes, plus les pages générées au build (une par fuite). */
export function sitemapXml(extra: readonly PageMeta[] = []): string {
  const urls = [...PAGES, ...extra].map((p) => `  <url><loc>${SITE_URL}${p.path}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export function robotsTxt(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}
