/**
 * Dates au format ISO « AAAA-MM-JJ », sans heure ni fuseau.
 * On évite `Date` pour l'arithmétique afin de ne jamais décaler d'un jour
 * selon le fuseau de la personne.
 */

export type IsoDate = string;

interface Ymd {
  y: number;
  m: number; // 1-12
  d: number; // 1-31
}

const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

function isLeapYear(y: number): boolean {
  return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
}

export function daysInMonth(y: number, m: number): number {
  if (m === 2) return isLeapYear(y) ? 29 : 28;
  return [4, 6, 9, 11].includes(m) ? 30 : 31;
}

function parse(iso: IsoDate): Ymd | null {
  const match = ISO_RE.exec(iso);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > daysInMonth(y, m)) return null;
  return { y, m, d };
}

function format({ y, m, d }: Ymd): IsoDate {
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function parseOrThrow(iso: IsoDate): Ymd {
  const ymd = parse(iso);
  if (!ymd) throw new Error(`Date invalide : « ${iso} »`);
  return ymd;
}

export function isValidIsoDate(value: unknown): value is IsoDate {
  return typeof value === 'string' && parse(value) !== null;
}

/** Date du jour dans le fuseau local de la personne. */
export function todayIso(now: Date = new Date()): IsoDate {
  return format({ y: now.getFullYear(), m: now.getMonth() + 1, d: now.getDate() });
}

/**
 * Ajoute des mois selon le règlement (CEE, Euratom) n° 1182/71, art. 3.2 c) :
 * le délai expire le jour du dernier mois qui porte le même quantième ;
 * si ce jour n'existe pas, il expire le dernier jour de ce mois.
 */
export function addMonths(iso: IsoDate, months: number): IsoDate {
  const { y, m, d } = parseOrThrow(iso);
  const index = y * 12 + (m - 1) + months;
  const ny = Math.floor(index / 12);
  const nm = (index % 12) + 1;
  return format({ y: ny, m: nm, d: Math.min(d, daysInMonth(ny, nm)) });
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const { y, m, d } = parseOrThrow(iso);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return format({ y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate() });
}

/** Nombre de jours de `from` à `to` (négatif si `to` est avant `from`). */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  const a = parseOrThrow(from);
  const b = parseOrThrow(to);
  const ms = Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d);
  return Math.round(ms / 86_400_000);
}

/** « 1er octobre 2026 », « 15 mars 2027 ». */
export function formatLongFr(iso: IsoDate): string {
  const { y, m, d } = parseOrThrow(iso);
  return `${d === 1 ? '1er' : d} ${MONTHS_FR[m - 1]} ${y}`;
}

/**
 * Délais de l'article 12.3 du RGPD : un mois à compter de la réception,
 * prolongeable de deux mois (soit trois mois au total).
 */
export function gdprDeadlines(receivedOn: IsoDate): { standard: IsoDate; extended: IsoDate } {
  return { standard: addMonths(receivedOn, 1), extended: addMonths(receivedOn, 3) };
}
