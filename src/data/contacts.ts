/**
 * Contacts officiels de protection des données des entreprises touchées par une
 * fuite, indexés par le nom HIBP de la fuite.
 *
 * Règle n° 3 : jamais de contact inventé. Chaque entrée cite la page publique où
 * le contact apparaît (politique de confidentialité, mentions légales) et la date
 * de vérification. contacts.test.ts refuse toute entrée incomplète.
 */

import type { IsoDate } from '../lib/dates';

export interface DpoContact {
  /** Adresse e-mail du DPO, ou adresse d'un formulaire en ligne. */
  contact: string;
  kind: 'email' | 'formulaire';
  /** Page publique où le contact est indiqué. */
  source: string;
  verifiedOn: IsoDate;
}

export const DPO_CONTACTS: Record<string, DpoContact> = {};
