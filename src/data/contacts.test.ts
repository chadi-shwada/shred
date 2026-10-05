import { describe, expect, it } from 'vitest';
import { isValidIsoDate } from '../lib/dates';
import { DPO_CONTACTS } from './contacts';

describe('contacts DPO', () => {
  const entries = Object.entries(DPO_CONTACTS);

  it.each(entries)('%s : contact, source et date de vérification', (_, c) => {
    expect(c.contact.trim()).not.toBe('');
    expect(c.source).toMatch(/^https:\/\//);
    expect(isValidIsoDate(c.verifiedOn)).toBe(true);
    if (c.kind === 'email') expect(c.contact).toMatch(/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i);
    else expect(c.contact).toMatch(/^https:\/\//);
  });

  it('existe (vide autorisé)', () => {
    expect(Array.isArray(entries)).toBe(true);
  });
});
