/**
 * Pages publiques par fuite française (/fuite/free…), résumé du catalogue pour
 * l'accueil et flux Atom des fuites françaises. Tout est tiré du catalogue
 * public HIBP (métadonnées seulement) au build : aucune requête à l'exécution.
 */

import { dataClassLabel, formatCount, recentFrenchBreaches, type Breach, type BreachCatalog } from './breaches';
import { formatLongFr, type IsoDate } from './dates';
import { breachRisk, type RiskLevel } from './risk';
import { slugify } from './slug';

export const BREACH_PATH_PREFIX = '/fuite/';

/**
 * Fuites qui ont une page : françaises, avec une entreprise identifiée (un
 * domaine) à qui écrire. Les compilations sans domaine en sont exclues. Les plus
 * récentes d'abord.
 */
export function pageBreaches(breaches: Breach[]): Breach[] {
  return recentFrenchBreaches(breaches, Number.POSITIVE_INFINITY).filter((b) => b.domain !== '');
}

/**
 * Adresse lisible tirée du titre (« La Poste Mobile » → la-poste-mobile).
 * Si deux fuites donnent la même, chacune prend son nom HIBP, qui est unique.
 */
export function breachSlugs(breaches: Breach[]): Map<string, Breach> {
  const byTitle = new Map<string, Breach[]>();
  for (const b of breaches) {
    const slug = slugify(b.title);
    byTitle.set(slug, [...(byTitle.get(slug) ?? []), b]);
  }
  const slugs = new Map<string, Breach>();
  for (const [slug, list] of byTitle) {
    if (list.length === 1) slugs.set(slug, list[0]!);
    else for (const b of list) slugs.set(slugify(b.name), b);
  }
  return slugs;
}

/** Index inverse : nom HIBP → adresse de la page, pour les liens. */
export function breachPathsByName(breaches: Breach[]): Map<string, string> {
  return new Map([...breachSlugs(pageBreaches(breaches))].map(([slug, b]) => [b.name, BREACH_PATH_PREFIX + slug]));
}

export function findBreachBySlug(breaches: Breach[], slug: string): Breach | null {
  return breachSlugs(pageBreaches(breaches)).get(slug) ?? null;
}

const count = formatCount;

const MONTHS_SHORT = [
  'janv.',
  'févr.',
  'mars',
  'avr.',
  'mai',
  'juin',
  'juil.',
  'août',
  'sept.',
  'oct.',
  'nov.',
  'déc.',
];

/** « oct. 2024 ». */
export function formatMonthFr(iso: IsoDate): string {
  return `${MONTHS_SHORT[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
}

export interface BreachPageMeta {
  path: string;
  title: string;
  description: string;
}

export function breachPageMeta(breach: Breach, slug: string): BreachPageMeta {
  const types = breach.dataClasses.slice(0, 4).map(dataClassLabel).join(', ');
  const accounts = breach.pwnCount > 0 ? `${count(breach.pwnCount)} comptes, ` : '';
  return {
    path: BREACH_PATH_PREFIX + slug,
    title: `Fuite ${breach.title} (${formatMonthFr(breach.date)}) : que faire ? · ShredRGPD`,
    description: `Fuite de données ${breach.title} du ${formatLongFr(breach.date)} : ${accounts}${types}. Vérifie si tu es concerné et demande à l'entreprise ce qu'elle détient sur toi, avec une lettre RGPD gratuite.`,
  };
}

/** Toutes les pages de fuite, pour le build (HTML, sitemap). */
export function allBreachPageMeta(breaches: Breach[]): BreachPageMeta[] {
  return [...breachSlugs(pageBreaches(breaches))].map(([slug, b]) => breachPageMeta(b, slug));
}

/* ---------- Résumé pour l'accueil ---------- */

export interface CatalogSummary {
  fetchedOn: IsoDate | null;
  total: number;
  french: number;
  latest: {
    name: string;
    title: string;
    path: string;
    date: IsoDate;
    pwnCount: number;
    dataClasses: string[];
    risk: RiskLevel;
  }[];
}

export function catalogSummary(catalog: BreachCatalog, latest = 6): CatalogSummary {
  const french = pageBreaches(catalog.breaches);
  const paths = breachPathsByName(catalog.breaches);
  return {
    fetchedOn: catalog.fetchedOn,
    total: catalog.breaches.length,
    french: french.length,
    latest: french.slice(0, latest).map((b) => ({
      name: b.name,
      title: b.title,
      path: paths.get(b.name)!,
      date: b.date,
      pwnCount: b.pwnCount,
      dataClasses: b.dataClasses.map(dataClassLabel),
      risk: breachRisk(b.dataClasses),
    })),
  };
}

/* ---------- Flux Atom ---------- */

const xml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Flux Atom des fuites françaises, par date d'ajout au catalogue HIBP (la plus
 * récente d'abord) : on s'abonne sans compte ni e-mail.
 */
export function breachFeed(catalog: BreachCatalog, siteUrl: string, limit = 30): string {
  const paths = breachPathsByName(catalog.breaches);
  const entries = pageBreaches(catalog.breaches)
    .map((b) => ({ b, added: b.addedDate ?? b.date }))
    .sort((x, y) => y.added.localeCompare(x.added))
    .slice(0, limit);
  const updated = `${entries[0]?.added ?? catalog.fetchedOn ?? '2026-01-01'}T00:00:00Z`;
  const items = entries.map(({ b, added }) => {
    const url = siteUrl + paths.get(b.name)!;
    const types = b.dataClasses.map(dataClassLabel).join(', ');
    const accounts = b.pwnCount > 0 ? ` ${count(b.pwnCount)} comptes.` : '';
    return `  <entry>
    <title>${xml(`Fuite ${b.title} (${formatMonthFr(b.date)})`)}</title>
    <link href="${xml(url)}" />
    <id>${xml(url)}</id>
    <updated>${added}T00:00:00Z</updated>
    <summary>${xml(`Fuite du ${formatLongFr(b.date)}.${accounts} Données exposées : ${types}.`)}</summary>
  </entry>`;
  });
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="fr">
  <title>ShredRGPD · Fuites de données en France</title>
  <subtitle>Fuites françaises du catalogue public Have I Been Pwned (CC BY 4.0), avec la marche à suivre.</subtitle>
  <link href="${xml(siteUrl)}/fuites.xml" rel="self" />
  <link href="${xml(siteUrl)}/" />
  <id>${xml(siteUrl)}/fuites.xml</id>
  <updated>${updated}</updated>
${items.join('\n')}
</feed>
`;
}
