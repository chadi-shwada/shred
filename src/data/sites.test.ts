import { describe, expect, it } from 'vitest';
import { isValidIsoDate } from '../lib/dates';
import { KNOWN_SITES } from './sites';

describe('sites connus', () => {
  it.each(KNOWN_SITES.map((s) => [s.id, s] as const))('%s a une source et une date de vérification', (_, site) => {
    expect(site.source.trim()).not.toBe('');
    expect(isValidIsoDate(site.verifiedOn)).toBe(true);
  });

  it.each(KNOWN_SITES.map((s) => [s.id, s] as const))('%s : un contact rempli cite sa source', (_, site) => {
    if (site.contact.trim()) expect(site.contactSource.trim()).not.toBe('');
  });

  it('a des identifiants uniques', () => {
    expect(new Set(KNOWN_SITES.map((s) => s.id)).size).toBe(KNOWN_SITES.length);
  });
});
