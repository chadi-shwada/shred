/**
 * Suivi des demandes, stocké uniquement dans le navigateur (localStorage).
 * Aucune identité n'est enregistrée : seulement le site, les dates et les notes.
 */

import { daysBetween, gdprDeadlines, isValidIsoDate, type IsoDate } from './dates';
import { INITIAL_KINDS, isInitialKind, type InitialKind } from './letters';

export type Channel = 'email' | 'formulaire' | 'courrier';

export type Status = 'envoyee' | 'prolongee' | 'relancee' | 'reclamation' | 'satisfaite' | 'refusee';

export const STATUS_LABELS: Record<Status, string> = {
  envoyee: 'Envoyée',
  prolongee: 'Délai prolongé par le site',
  relancee: 'Relancée',
  reclamation: 'Réclamation CNIL déposée',
  satisfaite: 'Satisfaite',
  refusee: 'Refusée',
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  email: 'E-mail',
  formulaire: 'Formulaire du site',
  courrier: 'Courrier',
};

export const KIND_LABELS = Object.fromEntries(
  Object.entries(INITIAL_KINDS).map(([kind, { label }]) => [kind, label]),
) as Record<InitialKind, string>;

export interface TrackedRequest {
  id: string;
  site: string;
  kind: InitialKind;
  channel: Channel;
  /** Date d'envoi, ou de réception si elle est connue. Le délai part de la réception. */
  sentOn: IsoDate;
  status: Status;
  notes: string;
  /**
   * Copies des lettres envoyées, gardées seulement si la personne le choisit
   * (elles contiennent son nom). Servent au dossier de plainte CNIL.
   */
  letters?: SavedLetter[];
}

export interface SavedLetter {
  date: IsoDate;
  subject: string;
  body: string;
}

export type Urgency = 'close' | 'en-cours' | 'bientot' | 'depassee';

export interface RequestState {
  deadline: IsoDate;
  daysLeft: number;
  urgency: Urgency;
}

const CLOSED: ReadonlySet<Status> = new Set(['satisfaite', 'refusee', 'reclamation']);
const SOON_DAYS = 7;

export function isClosed(status: Status): boolean {
  return CLOSED.has(status);
}

/** Échéance de l'article 12.3 : un mois, ou trois si le site a prolongé le délai. */
export function deadlineOf(request: TrackedRequest): IsoDate {
  const { standard, extended } = gdprDeadlines(request.sentOn);
  return request.status === 'prolongee' ? extended : standard;
}

export function stateOf(request: TrackedRequest, today: IsoDate): RequestState {
  const deadline = deadlineOf(request);
  const daysLeft = daysBetween(today, deadline);
  let urgency: Urgency;
  if (isClosed(request.status)) urgency = 'close';
  else if (daysLeft < 0) urgency = 'depassee';
  else if (daysLeft <= SOON_DAYS) urgency = 'bientot';
  else urgency = 'en-cours';
  return { deadline, daysLeft, urgency };
}

const URGENCY_ORDER: Record<Urgency, number> = { depassee: 0, bientot: 1, 'en-cours': 2, close: 3 };

/** Les demandes à traiter d'abord, puis par échéance la plus proche. */
export function sortRequests(requests: TrackedRequest[], today: IsoDate): TrackedRequest[] {
  return [...requests].sort((a, b) => {
    const sa = stateOf(a, today);
    const sb = stateOf(b, today);
    return URGENCY_ORDER[sa.urgency] - URGENCY_ORDER[sb.urgency] || sa.deadline.localeCompare(sb.deadline);
  });
}

/* ---------- Export et import JSON ---------- */

export const EXPORT_FORMAT = 'shred-suivi';
export const EXPORT_VERSION = 1;

export interface ExportFile {
  format: typeof EXPORT_FORMAT;
  version: typeof EXPORT_VERSION;
  exportedOn: IsoDate;
  requests: TrackedRequest[];
}

export function serializeExport(requests: TrackedRequest[], exportedOn: IsoDate): string {
  const file: ExportFile = { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedOn, requests };
  return JSON.stringify(file, null, 2);
}

export class ImportError extends Error {}

const CHANNELS: readonly string[] = Object.keys(CHANNEL_LABELS);
const STATUSES: readonly string[] = Object.keys(STATUS_LABELS);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseRequest(value: unknown, index: number): TrackedRequest {
  const where = `Demande n° ${index + 1}`;
  if (!isRecord(value)) throw new ImportError(`${where} : format invalide.`);
  const { id, site, kind, channel, sentOn, status, notes, letters } = value;
  if (typeof id !== 'string' || !id) throw new ImportError(`${where} : identifiant manquant.`);
  if (typeof site !== 'string' || !site.trim()) throw new ImportError(`${where} : site manquant.`);
  if (!isInitialKind(kind)) throw new ImportError(`${where} : type inconnu.`);
  if (typeof channel !== 'string' || !CHANNELS.includes(channel)) throw new ImportError(`${where} : canal inconnu.`);
  if (!isValidIsoDate(sentOn)) throw new ImportError(`${where} : date d'envoi invalide.`);
  if (typeof status !== 'string' || !STATUSES.includes(status)) throw new ImportError(`${where} : statut inconnu.`);
  return {
    id,
    site: site.trim(),
    kind: kind as InitialKind,
    channel: channel as Channel,
    sentOn,
    status: status as Status,
    notes: typeof notes === 'string' ? notes : '',
    ...(Array.isArray(letters) && { letters: letters.filter(isSavedLetter) }),
  };
}

function isSavedLetter(value: unknown): value is SavedLetter {
  return (
    isRecord(value) && isValidIsoDate(value.date) && typeof value.subject === 'string' && typeof value.body === 'string'
  );
}

/** Ajoute une copie de lettre à une demande. */
export function withLetter(request: TrackedRequest, letter: SavedLetter): TrackedRequest {
  return { ...request, letters: [...(request.letters ?? []), letter] };
}

export function parseExport(text: string): TrackedRequest[] {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new ImportError("Ce fichier n'est pas du JSON valide.");
  }
  if (!isRecord(data) || data.format !== EXPORT_FORMAT) {
    throw new ImportError("Ce fichier n'est pas un export de suivi Shred.");
  }
  if (data.version !== EXPORT_VERSION) {
    throw new ImportError(`Version d'export non prise en charge : ${String(data.version)}.`);
  }
  if (!Array.isArray(data.requests)) throw new ImportError('La liste des demandes est absente.');
  const requests = data.requests.map(parseRequest);
  const ids = new Set(requests.map((r) => r.id));
  if (ids.size !== requests.length) throw new ImportError('Le fichier contient des identifiants en double.');
  return requests;
}

/** Fusionne un import : les demandes importées remplacent celles qui ont le même identifiant. */
export function mergeRequests(current: TrackedRequest[], imported: TrackedRequest[]): TrackedRequest[] {
  const byId = new Map(current.map((r) => [r.id, r]));
  for (const r of imported) byId.set(r.id, r);
  return [...byId.values()];
}

/* ---------- Stockage local ---------- */

export const STORAGE_KEY = 'shred.suivi.v1';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

/** Lit le suivi. Renvoie une liste vide si le stockage est indisponible ou illisible. */
export function loadRequests(storage: StorageLike | undefined): TrackedRequest[] {
  try {
    const raw = storage?.getItem(STORAGE_KEY);
    if (!raw) return [];
    return parseExport(raw);
  } catch {
    return [];
  }
}

/** Enregistre le suivi. Renvoie false si le navigateur refuse (navigation privée, quota). */
export function saveRequests(storage: StorageLike | undefined, requests: TrackedRequest[], today: IsoDate): boolean {
  try {
    if (!storage) return false;
    storage.setItem(STORAGE_KEY, serializeExport(requests, today));
    return true;
  } catch {
    return false;
  }
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
