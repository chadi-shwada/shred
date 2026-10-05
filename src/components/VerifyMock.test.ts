import { describe, expect, it } from 'vitest';
import { exposedCount } from './VerifyMock';

describe('aperçu Vérifier', () => {
  it('compte les types de données distincts des fuites cochées', () => {
    expect(exposedCount(0)).toBe(0);
    expect(exposedCount(1)).toBe(3);
    // l'adresse e-mail figure dans les deux fuites : 5 types, pas 6
    expect(exposedCount(2)).toBe(5);
  });
});
