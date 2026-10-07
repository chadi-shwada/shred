/**
 * Chiffres des fuites françaises pour la page /chiffres, calculés au build à
 * partir du catalogue public HIBP (métadonnées seulement) : aucune requête à
 * l'exécution, et rien sur les visiteurs du site.
 *
 * Périmètre : les fuites qui ont une page (pageBreaches), c'est-à-dire
 * françaises selon l'heuristique du build, avec une entreprise identifiée, hors
 * logiciels malveillants, listes de spam et fuites fabriquées. Le même chiffre
 * que l'accueil.
 */

import { dataClassLabel, RISKY_DATA_CLASSES, type BreachCatalog } from './breaches';
import { breachPathsByName, pageBreaches } from './breachPages';
import { daysBetween, type IsoDate } from './dates';

/** Types HIBP comptés comme « données bancaires ». */
export const BANK_DATA_CLASSES: ReadonlySet<string> = new Set([
  'Bank account numbers',
  'Credit cards',
  'Partial credit card data',
]);

/** Fiche légère d'une fuite, embarquée dans la page /chiffres (module virtuel). */
export interface StatBreach {
  title: string;
  path: string;
  date: IsoDate;
  addedDate: IsoDate | null;
  pwnCount: number;
  /** Types HIBP (noms anglais, sans doublon). */
  dataClasses: string[];
}

export interface StatsSource {
  fetchedOn: IsoDate | null;
  breaches: StatBreach[];
}

/** Les fuites du périmètre, réduites à ce que la page affiche. */
export function statsSource(catalog: BreachCatalog): StatsSource {
  const paths = breachPathsByName(catalog.breaches);
  return {
    fetchedOn: catalog.fetchedOn,
    breaches: pageBreaches(catalog.breaches).map((b) => ({
      title: b.title,
      path: paths.get(b.name)!,
      date: b.date,
      addedDate: b.addedDate,
      pwnCount: b.pwnCount,
      dataClasses: [...new Set(b.dataClasses)],
    })),
  };
}

export const yearOf = (b: StatBreach): number => Number(b.date.slice(0, 4));

/** Toutes les années de la plus ancienne à la plus récente fuite, années vides comprises. */
export function yearSpan(breaches: StatBreach[]): number[] {
  if (breaches.length === 0) return [];
  const years = breaches.map(yearOf);
  const out: number[] = [];
  for (let y = Math.min(...years); y <= Math.max(...years); y += 1) out.push(y);
  return out;
}

export interface StatsFilter {
  year?: number;
  /** Type HIBP (nom anglais). */
  dataClass?: string;
}

export function filterBreaches(breaches: StatBreach[], filter: StatsFilter): StatBreach[] {
  return breaches.filter(
    (b) =>
      (filter.year === undefined || yearOf(b) === filter.year) &&
      (filter.dataClass === undefined || b.dataClasses.includes(filter.dataClass)),
  );
}

/** Types de données présents, du plus au moins fréquent (liste du filtre). */
export function dataClassOptions(breaches: StatBreach[]): { key: string; label: string; count: number }[] {
  const perType = new Map<string, number>();
  for (const b of breaches) for (const dc of b.dataClasses) perType.set(dc, (perType.get(dc) ?? 0) + 1);
  return [...perType]
    .map(([key, count]) => ({ key, label: dataClassLabel(key), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr'));
}

export interface YearStat {
  year: number;
  count: number;
  /** Titres des fuites de l'année, pour l'infobulle. */
  titles: string[];
}

export interface DataTypeStat {
  /** Type HIBP (nom anglais), pour le filtre. */
  key: string;
  /** Libellé français. */
  label: string;
  /** Nombre de fuites qui contiennent ce type de données. */
  count: number;
  /** Part des fuites, entre 0 et 1. */
  share: number;
  /** Mots de passe ou données bancaires. */
  risky: boolean;
}

export interface BreachStats {
  /** Nombre de fuites retenues. */
  count: number;
  /**
   * Fuites de plus d'un million de comptes. Pas de total des comptes : il serait
   * dominé par quelques fuites mondiales (Deezer) et compterait plusieurs fois
   * les mêmes personnes.
   */
  overMillion: number;
  /** Une entrée par année de `years` (toutes les années par défaut). */
  byYear: YearStat[];
  /** Types de données les plus fréquents, du plus au moins fréquent. */
  dataTypes: DataTypeStat[];
  passwords: { count: number; share: number };
  bank: { count: number; share: number };
  /** Les plus grosses fuites, en nombre de comptes. */
  biggest: StatBreach[];
  /** Délai médian, en jours, entre la fuite et son ajout au catalogue HIBP. */
  medianDelayDays: number | null;
  /** Nombre de fuites dont les deux dates sont connues (base de la médiane). */
  delaySample: number;
}

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

export function computeStats(
  breaches: StatBreach[],
  options: { dataTypes?: number; biggest?: number; years?: number[] } = {},
): BreachStats {
  const count = breaches.length;
  const share = (n: number) => (count ? n / count : 0);

  const byYear = (options.years ?? yearSpan(breaches)).map((year) => {
    const of = breaches.filter((b) => yearOf(b) === year);
    return { year, count: of.length, titles: of.map((b) => b.title) };
  });

  const dataTypes = dataClassOptions(breaches)
    .slice(0, options.dataTypes ?? 10)
    .map((d) => ({ ...d, share: share(d.count), risky: RISKY_DATA_CLASSES.has(d.key) }));

  const withPasswords = breaches.filter((b) => b.dataClasses.includes('Passwords')).length;
  const withBank = breaches.filter((b) => b.dataClasses.some((dc) => BANK_DATA_CLASSES.has(dc))).length;

  const biggest = breaches
    .filter((b) => b.pwnCount > 0)
    .sort((a, b) => b.pwnCount - a.pwnCount)
    .slice(0, options.biggest ?? 10);

  // Une date d'ajout antérieure à la fuite est une incohérence du catalogue : écartée.
  const delays = breaches
    .filter((b) => b.addedDate && b.addedDate >= b.date)
    .map((b) => daysBetween(b.date, b.addedDate!));

  return {
    count,
    overMillion: breaches.filter((b) => b.pwnCount >= 1_000_000).length,
    byYear,
    dataTypes,
    passwords: { count: withPasswords, share: share(withPasswords) },
    bank: { count: withBank, share: share(withBank) },
    biggest,
    medianDelayDays: median(delays),
    delaySample: delays.length,
  };
}

/** « 12 % » ; « moins de 1 % » plutôt que « 0 % » quand la part n'est pas nulle. */
export function formatShare(share: number): string {
  if (share > 0 && share < 0.005) return 'moins de 1 %';
  return `${Math.round(share * 100)} %`;
}

/** « 56,3 millions », « 940 000 », « 1,2 milliard ». */
export function formatBigCount(n: number): string {
  const fmt = (x: number) => new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 }).format(x);
  if (n >= 1e9) return `${fmt(n / 1e9)} milliard${n >= 2e9 ? 's' : ''}`;
  if (n >= 1e6) return `${fmt(n / 1e6)} million${n >= 2e6 ? 's' : ''}`;
  return new Intl.NumberFormat('fr-FR').format(n);
}

/** Délai lisible : « 12 jours », « 7 mois », « 2 ans et 3 mois ». */
export function formatDelay(days: number): string {
  if (days < 60) return `${days} jour${days > 1 ? 's' : ''}`;
  const months = Math.round(days / 30.44);
  if (months < 24) return `${months} mois`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return `${y} ans${m ? ` et ${m} mois` : ''}`;
}
