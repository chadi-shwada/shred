import { describe, expect, it } from 'vitest';
import { slugify } from './slug';

describe('slugify', () => {
  it('produit un nom de fichier sûr', () => {
    expect(slugify('Données Fuitées.com / Été')).toBe('donnees-fuitees-com-ete');
    expect(slugify('***')).toBe('lettre');
  });
});
