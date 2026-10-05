/**
 * Catalogue public des fuites (Have I Been Pwned, licence CC BY 4.0).
 *
 * Ce sont des métadonnées publiques (nom, date, types de données exposées),
 * jamais les données fuitées elles-mêmes : la règle n° 2 est respectée.
 * Le fichier est téléchargé au build (scripts/fetch-breaches.mjs) et embarqué
 * dans le site : aucune requête n'est faite à l'exécution.
 */

import { isValidIsoDate, type IsoDate } from './dates';
import type { DataCategory } from './letters';

export interface Breach {
  /** Identifiant HIBP, stable. */
  name: string;
  title: string;
  domain: string;
  date: IsoDate;
  pwnCount: number;
  dataClasses: string[];
  verified: boolean;
  fabricated: boolean;
  sensitive: boolean;
  spamList: boolean;
}

export interface BreachCatalog {
  fetchedOn: IsoDate | null;
  breaches: Breach[];
}

export const EMPTY_CATALOG: BreachCatalog = { fetchedOn: null, breaches: [] };

export const HIBP_URL = 'https://haveibeenpwned.com';
export const HIBP_LICENSE_URL = 'https://creativecommons.org/licenses/by/4.0/';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toBreach(raw: unknown): Breach | null {
  if (!isRecord(raw)) return null;
  const { Name, Title, Domain, BreachDate, PwnCount, DataClasses } = raw;
  if (typeof Name !== 'string' || !Name) return null;
  if (typeof BreachDate !== 'string' || !isValidIsoDate(BreachDate)) return null;
  return {
    name: Name,
    title: typeof Title === 'string' && Title ? Title : Name,
    domain: typeof Domain === 'string' ? Domain : '',
    date: BreachDate,
    pwnCount: typeof PwnCount === 'number' ? PwnCount : 0,
    dataClasses: Array.isArray(DataClasses) ? DataClasses.filter((d): d is string => typeof d === 'string') : [],
    verified: raw.IsVerified === true,
    fabricated: raw.IsFabricated === true,
    sensitive: raw.IsSensitive === true,
    spamList: raw.IsSpamList === true,
  };
}

/** Lit le fichier généré au build. Les entrées invalides sont ignorées. */
export function parseCatalog(raw: unknown): BreachCatalog {
  if (!isRecord(raw) || !Array.isArray(raw.breaches)) return EMPTY_CATALOG;
  const fetchedOn = typeof raw.fetchedOn === 'string' && isValidIsoDate(raw.fetchedOn) ? raw.fetchedOn : null;
  const breaches = raw.breaches.map(toBreach).filter((b): b is Breach => b !== null);
  return { fetchedOn, breaches };
}

/* ---------- Types de données ---------- */

const TO_CATEGORY: Record<string, DataCategory> = {
  'Email addresses': 'email',
  Passwords: 'motDePasse',
  Usernames: 'identifiant',
  'IP addresses': 'ip',
  Names: 'nomPrenom',
  'Phone numbers': 'telephone',
  'Physical addresses': 'adresse',
  'Dates of birth': 'dateNaissance',
  'Credit cards': 'bancaire',
  'Partial credit card data': 'bancaire',
  'Bank account numbers': 'bancaire',
};

const FRENCH: Record<string, string> = {
  'Email addresses': 'adresses e-mail',
  Passwords: 'mots de passe',
  Usernames: 'identifiants',
  'IP addresses': 'adresses IP',
  Names: 'noms',
  'Phone numbers': 'numéros de téléphone',
  'Physical addresses': 'adresses postales',
  'Dates of birth': 'dates de naissance',
  'Credit cards': 'cartes bancaires',
  'Partial credit card data': 'données partielles de carte bancaire',
  'Bank account numbers': 'numéros de compte bancaire',
  Genders: 'genre',
  'Geographic locations': 'localisation',
  'Job titles': 'intitulé de poste',
  Employers: 'employeur',
  'Social media profiles': 'profils de réseaux sociaux',
  'Password hints': 'indices de mot de passe',
  'Security questions and answers': 'questions et réponses de sécurité',
  'Auth tokens': "jetons d'authentification",
  'Device information': "informations sur l'appareil",
  Purchases: 'achats',
  'Website activity': 'activité sur le site',
  'Spoken languages': 'langues parlées',
  Ages: 'âge',
  Salutations: 'civilité',
  'Education levels': "niveau d'études",
  'Government issued IDs': "pièces d'identité",
  'Passport numbers': 'numéros de passeport',
  'Social security numbers': 'numéros de sécurité sociale',
  'Credit status information': 'informations de solvabilité',
  'Income levels': 'niveau de revenus',
  'Marital statuses': 'situation familiale',
  'Sexual orientations': 'orientation sexuelle',
  Religions: 'religion',
  'Health insurance information': "informations d'assurance santé",
  'Private messages': 'messages privés',
  'Browser user agent details': 'informations du navigateur',
  'Physical attributes': 'caractéristiques physiques',
  'Partial dates of birth': 'dates de naissance partielles',
};

/** Libellé français d'un type de données HIBP (l'original si inconnu). */
export function dataClassLabel(dataClass: string): string {
  return FRENCH[dataClass] ?? dataClass;
}

/** Répartit les types HIBP entre cases du générateur et texte libre, sans doublon. */
export function mapDataClasses(dataClasses: string[]): { categories: DataCategory[]; others: string[] } {
  const categories: DataCategory[] = [];
  const others: string[] = [];
  for (const dc of dataClasses) {
    const category = TO_CATEGORY[dc];
    if (category) {
      if (!categories.includes(category)) categories.push(category);
    } else {
      const label = dataClassLabel(dc);
      if (!others.includes(label)) others.push(label);
    }
  }
  return { categories, others };
}

/* ---------- Recherche ---------- */

function normalize(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Recherche par nom ou domaine, insensible à la casse et aux accents.
 * Sans requête : les fuites les plus récentes. Les correspondances en début
 * de nom passent devant, puis tri par date décroissante.
 */
export function searchBreaches(breaches: Breach[], query: string, limit = 20): Breach[] {
  const q = normalize(query);
  const byDate = (a: Breach, b: Breach) => b.date.localeCompare(a.date);
  if (!q) return [...breaches].sort(byDate).slice(0, limit);
  const scored: { breach: Breach; score: number }[] = [];
  for (const breach of breaches) {
    const fields = [breach.title, breach.name, breach.domain].map(normalize);
    if (fields.some((f) => f === q)) scored.push({ breach, score: 0 });
    else if (fields.some((f) => f.startsWith(q))) scored.push({ breach, score: 1 });
    else if (fields.some((f) => f.includes(q))) scored.push({ breach, score: 2 });
  }
  return scored
    .sort((a, b) => a.score - b.score || byDate(a.breach, b.breach))
    .slice(0, limit)
    .map((s) => s.breach);
}
