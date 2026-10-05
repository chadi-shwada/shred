import { describe, expect, it } from 'vitest';
import { isFrenchBreach } from '../../scripts/french.mjs';
import { parseCatalog, recentFrenchBreaches } from './breaches';

describe('isFrenchBreach (heuristique du build)', () => {
  it('retient un domaine en .fr', () => {
    expect(isFrenchBreach({ Domain: 'exemple.fr' })).toBe(true);
    expect(isFrenchBreach({ Domain: 'EXEMPLE.FR ' })).toBe(true);
  });

  it('retient les entreprises françaises connues dont la description ne cite pas la France', () => {
    expect(isFrenchBreach({ Domain: 'dailymotion.com', Description: 'In 2016, the video sharing platform…' })).toBe(
      true,
    );
    expect(isFrenchBreach({ Domain: 'Deezer.com' })).toBe(true);
  });

  it('retient une description qui mentionne la France', () => {
    expect(isFrenchBreach({ Domain: 'exemple.com', Description: 'In 2024, the French retailer lost data.' })).toBe(
      true,
    );
    expect(isFrenchBreach({ Domain: '', Description: 'A forum based in France was breached.' })).toBe(true);
  });

  it('écarte le reste, sans faux positif sur un mot qui contient « france »', () => {
    expect(isFrenchBreach({ Domain: 'exemple.com', Description: 'A US gaming site.' })).toBe(false);
    expect(isFrenchBreach({ Domain: 'exemple.fr.example.com' })).toBe(false);
    expect(isFrenchBreach({ Description: 'Francesca lives in Frenchtown.' })).toBe(false);
    expect(isFrenchBreach({})).toBe(false);
  });
});

describe('recentFrenchBreaches', () => {
  const { breaches } = parseCatalog({
    breaches: [
      { Name: 'A', BreachDate: '2025-01-01', Domain: 'a.com', IsFrench: false },
      { Name: 'B', BreachDate: '2024-01-01', Domain: 'b.com', IsFrench: true },
      { Name: 'C', BreachDate: '2026-01-01', Domain: 'c.com', IsFrench: true },
      { Name: 'D', BreachDate: '2023-01-01', Domain: 'ancien.fr' },
      { Name: 'Malware', BreachDate: '2026-06-01', Domain: '', IsFrench: true, IsMalware: true },
      { Name: 'Spam', BreachDate: '2026-06-02', Domain: '', IsFrench: true, IsSpamList: true },
      { Name: 'Faux', BreachDate: '2026-06-03', Domain: 'faux.fr', IsFrench: true, IsFabricated: true },
    ],
  });

  it('ne garde que les fuites françaises à qui écrire, les plus récentes d’abord', () => {
    expect(recentFrenchBreaches(breaches).map((b) => b.name)).toEqual(['C', 'B', 'D']);
  });

  it('se rabat sur le domaine .fr pour un ancien fichier sans indice', () => {
    expect(breaches.find((b) => b.name === 'D')?.french).toBe(true);
  });

  it('respecte la limite', () => {
    expect(recentFrenchBreaches(breaches, 1).map((b) => b.name)).toEqual(['C']);
  });
});
