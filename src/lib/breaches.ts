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
  /** Date d'ajout au catalogue HIBP (null si inconnue). */
  addedDate: IsoDate | null;
  pwnCount: number;
  dataClasses: string[];
  verified: boolean;
  fabricated: boolean;
  sensitive: boolean;
  spamList: boolean;
  /** Données issues d'un logiciel malveillant : personne à qui écrire. */
  malware: boolean;
  /** Fuite française selon l'heuristique du build (scripts/french.mjs). */
  french: boolean;
}

export interface BreachCatalog {
  fetchedOn: IsoDate | null;
  breaches: Breach[];
}

export const EMPTY_CATALOG: BreachCatalog = { fetchedOn: null, breaches: [] };

export const HIBP_URL = 'https://haveibeenpwned.com';

/** Mention affichée près des logos d'entreprises (scripts/breach-logos.mjs). */
export const LOGO_NOTICE =
  "Logos fournis par Have I Been Pwned. Les marques appartiennent à leurs propriétaires ; Shred n'a aucun lien avec ces entreprises.";

/** Types de données les plus sensibles, mis en avant en rouge. */
export const RISKY_DATA_CLASSES: ReadonlySet<string> = new Set([
  'Passwords',
  'Credit cards',
  'Partial credit card data',
  'Bank account numbers',
]);

/** « 13 926 173 ». */
export function formatCount(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n);
}
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
    addedDate:
      typeof raw.AddedDate === 'string' && isValidIsoDate(raw.AddedDate.slice(0, 10))
        ? raw.AddedDate.slice(0, 10)
        : null,
    pwnCount: typeof PwnCount === 'number' ? PwnCount : 0,
    dataClasses: Array.isArray(DataClasses) ? DataClasses.filter((d): d is string => typeof d === 'string') : [],
    verified: raw.IsVerified === true,
    fabricated: raw.IsFabricated === true,
    sensitive: raw.IsSensitive === true,
    spamList: raw.IsSpamList === true,
    malware: raw.IsMalware === true,
    // Ancien fichier sans l'indice : on se rabat sur le domaine en .fr.
    french: typeof raw.IsFrench === 'boolean' ? raw.IsFrench : /\.fr$/i.test(typeof Domain === 'string' ? Domain : ''),
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
  'AI prompts': 'requêtes envoyées à une IA',
  'Academic records': 'dossiers scolaires',
  'Account balances': 'soldes de compte',
  'Address book contacts': "contacts du carnet d'adresses",
  'Age groups': "tranche d'âge",
  Appointments: 'rendez-vous',
  'Apps installed on devices': 'applications installées',
  'Astrological signs': 'signe astrologique',
  'Audio recordings': 'enregistrements audio',
  Avatars: 'avatars',
  'Beauty ratings': "notes d'apparence",
  'Biometric data': 'données biométriques',
  Bios: 'biographies',
  'Browsing histories': 'historique de navigation',
  'Buying preferences': "préférences d'achat",
  'Car ownership statuses': "possession d'un véhicule",
  'Career levels': 'niveau de carrière',
  'Cellular network names': 'opérateur mobile',
  'Charitable donations': 'dons caritatifs',
  'Chat logs': 'historique de discussions',
  'Citizenship statuses': 'citoyenneté',
  'Clothing sizes': 'tailles de vêtements',
  Comments: 'commentaires',
  'Company names': "noms d'entreprise",
  'Credit card CVV': 'cryptogrammes de carte bancaire',
  'Credit scores': 'score de crédit',
  'Cryptocurrency wallet addresses': 'adresses de portefeuille de cryptomonnaie',
  'Customer feedback': 'avis clients',
  'Customer interactions': 'échanges avec le service client',
  'Customer service records': 'dossiers du service client',
  'Deceased date': 'date de décès',
  'Deceased statuses': 'statut de décès',
  'Delivery instructions': 'instructions de livraison',
  'Device serial numbers': "numéros de série d'appareils",
  'Device usage tracking data': "données d'utilisation de l'appareil",
  Disabilities: 'handicap',
  'Display names': 'noms affichés',
  'Drinking habits': "consommation d'alcool",
  "Driver's licenses": 'permis de conduire',
  'Drug habits': 'consommation de drogues',
  Earnings: 'revenus',
  'Eating habits': 'habitudes alimentaires',
  'Email messages': 'e-mails',
  'Employment statuses': 'situation professionnelle',
  'Encrypted keys': 'clés chiffrées',
  Ethnicities: 'origine ethnique',
  "Family members' names": 'noms des proches',
  'Family structure': 'composition du foyer',
  'Financial investments': 'placements financiers',
  'Financial transactions': 'transactions financières',
  'Fitness levels': 'condition physique',
  'Flights taken': 'vols effectués',
  'Forum posts': 'messages de forum',
  'HIV statuses': 'statut VIH',
  'Historical passwords': 'anciens mots de passe',
  'Home ownership statuses': 'statut de propriétaire',
  'Homepage URLs': 'sites personnels',
  'IMEI numbers': 'numéros IMEI',
  'IMSI numbers': 'numéros IMSI',
  'IQ levels': 'quotient intellectuel',
  'Instant messenger identities': 'identifiants de messagerie instantanée',
  'Job applications': 'candidatures',
  'Language preferences': 'langue préférée',
  'Latitude and longitude pairs': 'coordonnées GPS',
  'Licence plates': "plaques d'immatriculation",
  'Living costs': 'dépenses courantes',
  'Loan information': 'informations de prêt',
  'Login histories': 'historique de connexions',
  'Loyalty program details': 'programme de fidélité',
  'MAC addresses': 'adresses MAC',
  'Mnemonic phrases': 'phrases de récupération',
  'Mothers maiden names': 'nom de jeune fille de la mère',
  Nationalities: 'nationalité',
  'Net worths': 'patrimoine',
  Nicknames: 'surnoms',
  Occupations: 'profession',
  PINs: 'codes PIN',
  'Parenting plans': "modalités de garde d'enfants",
  'Partial government issued IDs': "pièces d'identité partielles",
  'Partial phone numbers': 'numéros de téléphone partiels',
  'Password strengths': 'robustesse des mots de passe',
  'Payment histories': 'historique de paiements',
  'Payment methods': 'moyens de paiement',
  'Personal descriptions': 'descriptions personnelles',
  'Personal health data': 'données de santé',
  'Personal interests': "centres d'intérêt",
  Photos: 'photos',
  'Places of birth': 'lieu de naissance',
  'Political donations': 'dons politiques',
  'Political views': 'opinions politiques',
  'Professional skills': 'compétences professionnelles',
  'Profile photos': 'photos de profil',
  'Profile statistics': 'statistiques de profil',
  'Purchasing habits': "habitudes d'achat",
  Races: 'origine raciale',
  'Recovery email addresses': 'adresses e-mail de secours',
  'Relationship statuses': 'situation amoureuse',
  'Reward program balances': 'soldes de points de fidélité',
  'SMS messages': 'SMS',
  'School grades (class levels)': 'niveau scolaire',
  'Sexual fetishes': 'préférences sexuelles',
  'Shipment tracking numbers': 'numéros de suivi de colis',
  'Smoking habits': 'tabagisme',
  'Social connections': 'relations sociales',
  'Socioeconomic levels': 'catégorie socioprofessionnelle',
  'Spouses names': 'nom du conjoint',
  'Support tickets': "demandes d'assistance",
  'Survey results': 'réponses à des sondages',
  'Tattoo status': 'tatouages',
  'Taxation records': 'données fiscales',
  'Telecommunications carrier': 'opérateur téléphonique',
  'Time zones': 'fuseau horaire',
  'Travel habits': 'habitudes de voyage',
  'Travel plans': 'projets de voyage',
  'User statuses': 'statut du compte',
  'User website URLs': 'sites web des utilisateurs',
  'Utility bills': "factures d'énergie",
  'VIP statuses': 'statut VIP',
  'Vehicle details': 'informations sur le véhicule',
  'Vehicle identification numbers (VINs)': "numéros d'identification de véhicule (VIN)",
  'Vehicle registration plates': "plaques d'immatriculation",
  'Warranty claims': 'demandes de garantie',
  'Work habits': 'habitudes de travail',
  'Years of professional experience': "années d'expérience professionnelle",
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

/** Adresse de la fiche publique d'une fuite sur Have I Been Pwned. */
export function hibpBreachUrl(breach: Breach): string {
  return `${HIBP_URL}/Breach/${encodeURIComponent(breach.name)}`;
}

/**
 * Fuites françaises ajoutées au catalogue après une date (dernière visite),
 * les plus récentes d'abord. Sans date de référence : aucune.
 */
export function newFrenchBreachesSince(breaches: Breach[], since: IsoDate | null): Breach[] {
  if (!since) return [];
  return breaches
    .filter((b) => b.french && !b.malware && !b.spamList && !b.fabricated && b.addedDate && b.addedDate > since)
    .sort((a, b) => (b.addedDate ?? '').localeCompare(a.addedDate ?? ''));
}

/* ---------- Recherche ---------- */

/**
 * Les fuites françaises les plus récentes, sans celles où il n'y a pas
 * d'entreprise à qui écrire (logiciel malveillant, liste de spam, fuite fabriquée).
 */
export function recentFrenchBreaches(breaches: Breach[], limit = 12): Breach[] {
  return breaches
    .filter((b) => b.french && !b.malware && !b.spamList && !b.fabricated)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

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

export interface PastedMatch {
  breach: Breach;
  /**
   * true seulement si le nom apparaît comme un titre de résultat (seul sur sa
   * ligne, ou en début de ligne suivi de « : ») et qu'une seule fuite le porte.
   * Sinon (nom cité dans une phrase, un menu, un pied de page), la personne
   * confirme elle-même : la case n'est pas cochée d'office.
   */
  certain: boolean;
}

/** Taille maximale du texte analysé, largement au-dessus d'une page de résultats. */
export const PASTE_MAX_LENGTH = 200_000;

function unifyText(text: string): string {
  return text
    .normalize('NFC')
    .replace(/[\u2018\u2019\u02bc]/g, "'")
    .replace(/[\u00a0\u202f]/g, ' ')
    .replace(/[ \t]+/g, ' ');
}

/** Le nom occupe-t-il sa ligne, éventuellement suivi de « : » (« Cultura: In 2024… ») ? */
function isHeading(source: string, start: number, end: number, allowColon: boolean): boolean {
  const lineStart = source.lastIndexOf('\n', start - 1) + 1;
  const lineEnd = source.indexOf('\n', end);
  const before = source.slice(lineStart, start).trim();
  const after = source.slice(end, lineEnd === -1 ? undefined : lineEnd).trim();
  return before === '' && (after === '' || (allowColon && after.startsWith(':')));
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Repère les fuites citées dans un texte collé (page de résultats de Have I
 * Been Pwned, e-mail d'alerte). Tout se passe dans le navigateur : le texte,
 * qui contient l'adresse e-mail, n'est ni envoyé ni conservé.
 *
 * Le nom affiché de la fuite doit apparaître tel quel, casse comprise, comme
 * mot entier : « Free » ne correspond ni à « free » ni à « Freelance ». Un nom
 * contenu dans un nom plus long déjà trouvé (« Domino's » dans « Domino's
 * India ») est ignoré à cet endroit. Résultat dans l'ordre d'apparition.
 *
 * Le format exact de la page de Have I Been Pwned n'a pas pu être vérifié :
 * d'où la confirmation demandée à la personne avant de cocher.
 */
export function findBreachesInText(breaches: Breach[], text: string): PastedMatch[] {
  const source = unifyText(text.slice(0, PASTE_MAX_LENGTH));
  if (!source.trim()) return [];

  const byTitle = new Map<string, Breach[]>();
  for (const breach of breaches) {
    const title = unifyText(breach.title).trim();
    if (title.length < 2) continue;
    byTitle.set(title, [...(byTitle.get(title) ?? []), breach]);
  }

  const taken: [number, number][] = [];
  const overlaps = (start: number, end: number) => taken.some(([s, e]) => start < e && end > s);
  const found: { breach: Breach; at: number; certain: boolean }[] = [];

  const titles = [...byTitle.keys()].sort((a, b) => b.length - a.length);
  for (const title of titles) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(title)}(?![\\p{L}\\p{N}])`, 'gu');
    const shortWord = !/\s/.test(title) && title.length <= 4;
    let first = -1;
    let heading = false;
    for (const match of source.matchAll(pattern)) {
      const start = match.index;
      const end = start + match[0].length;
      if (overlaps(start, end)) continue;
      taken.push([start, end]);
      if (first === -1) first = start;
      heading ||= isHeading(source, start, end, !shortWord);
    }
    if (first === -1) continue;
    const group = byTitle.get(title) ?? [];
    for (const breach of group) found.push({ breach, at: first, certain: heading && group.length === 1 });
  }

  return found.sort((a, b) => a.at - b.at).map(({ breach, certain }) => ({ breach, certain }));
}
