/**
 * Sites connus qui exposent des données issues de fuites.
 *
 * Règles :
 * - chaque entrée cite une source publique et une date de vérification ;
 * - ne jamais inventer un contact de DPO ou de responsable de traitement :
 *   `contact` reste vide si aucune source ne l'atteste, et `contactSource`
 *   est obligatoire dès que `contact` est rempli.
 *
 * La liste est vide tant qu'aucune entrée n'a été vérifiée. Les tests
 * (sites.test.ts) refusent toute entrée incomplète.
 */

import type { IsoDate } from '../lib/dates';

export interface KnownSite {
  id: string;
  name: string;
  domain: string;
  /** Adresse e-mail ou URL de formulaire du DPO ou du responsable. Vide si inconnue. */
  contact: string;
  /** Source publique du contact (mentions légales, politique de confidentialité). */
  contactSource: string;
  /** Source qui documente l'exposition de données sur ce site. */
  source: string;
  verifiedOn: IsoDate;
}

export const KNOWN_SITES: KnownSite[] = [];
