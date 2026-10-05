import { describe, expect, it } from 'vitest';
import { extractDomain, icannLookupUrl } from './domain';

describe('extractDomain', () => {
  it('extrait le domaine d’une URL ou d’une saisie libre', () => {
    expect(extractDomain('https://www.Exemple.com/page?x=1')).toBe('exemple.com');
    expect(extractDomain('exemple-fuites.test')).toBe('exemple-fuites.test');
    expect(extractDomain(' forum.exemple.fr/dump ')).toBe('forum.exemple.fr');
  });

  it('refuse ce qui n’est pas un nom de domaine', () => {
    expect(extractDomain('')).toBeNull();
    expect(extractDomain('Exemple SA')).toBeNull();
    expect(extractDomain('192.168.1.1')).toBeNull();
    expect(extractDomain('localhost')).toBeNull();
  });
});

describe('icannLookupUrl', () => {
  it('pointe vers la recherche officielle de l’ICANN', () => {
    expect(icannLookupUrl('exemple.com')).toBe('https://lookup.icann.org/en/lookup?name=exemple.com');
  });
});
