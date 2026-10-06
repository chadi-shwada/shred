import { describe, expect, it } from 'vitest';
import { exposedCount } from './VerifyMock';

describe('aperçu Vérifier', () => {
  it('compte les types de données distincts des fuites cochées', () => {
    expect(exposedCount(0)).toBe(0);
    expect(exposedCount(1)).toBe(6);
    // Free et La Poste Mobile partagent six types ; seule l'adresse e-mail s'ajoute : 7, pas 13
    expect(exposedCount(2)).toBe(7);
  });
});
