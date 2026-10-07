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

/*
 * Contacts relevés par l'auteur sur les pages citées le 7 octobre 2026 (les pages
 * n'étaient pas joignables depuis l'environnement de développement). Clés vérifiées
 * sur les pages de fuite publiées : la fuite Free d'octobre 2024 s'appelle
 * FreeMobile dans HIBP.
 */
export const DPO_CONTACTS: Record<string, DpoContact> = {
  FreeMobile: {
    contact: 'dpo@iliad.fr',
    kind: 'email',
    source: 'https://www.free.fr/freebox/politique-de-confidentialite',
    verifiedOn: '2026-10-07',
  },
  BouyguesTelecom: {
    contact: 'dpo@bouyguestelecom.fr',
    kind: 'email',
    source: 'https://www.corporate.bouyguestelecom.fr/mentions-legales/politique-de-confidentialite/',
    verifiedOn: '2026-10-07',
  },
  Boulanger: {
    contact: 'dpo@boulanger.com',
    kind: 'email',
    source: 'https://www.boulanger.com/evenement/infos-legales',
    verifiedOn: '2026-10-07',
  },
  FFR: {
    contact: 'protection.donnees@ffr.fr',
    kind: 'email',
    source: 'https://www.ffr.fr/donnees-personnelles',
    verifiedOn: '2026-10-07',
  },
};
