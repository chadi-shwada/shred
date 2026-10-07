import { describe, expect, it } from 'vitest';
import { breachStats, formatBigCount, formatDelay, formatShare } from './breachStats';
import { EMPTY_CATALOG, parseCatalog } from './breaches';

const entry = (o: Record<string, unknown>) => ({
  Domain: 'exemple.fr',
  PwnCount: 1000,
  DataClasses: ['Email addresses', 'Names'],
  IsVerified: true,
  IsFrench: true,
  ...o,
});

const CATALOG = parseCatalog({
  fetchedOn: '2026-10-05',
  breaches: [
    entry({
      Name: 'FreeMobile',
      Title: 'Free',
      Domain: 'free.fr',
      BreachDate: '2024-10-17',
      AddedDate: '2025-05-27T00:00:00Z',
      PwnCount: 13926173,
      DataClasses: ['Bank account numbers', 'Names', 'Phone numbers'],
    }),
    entry({
      Name: 'Deezer',
      Domain: 'deezer.com',
      BreachDate: '2019-04-22',
      AddedDate: '2023-01-02T00:00:00Z',
      PwnCount: 229037936,
      DataClasses: ['Email addresses', 'Names', 'Names'],
    }),
    entry({
      Name: 'Pokebip',
      Title: 'Pokébip',
      BreachDate: '2015-07-28',
      AddedDate: '2016-09-09T00:00:00Z',
      PwnCount: 657001,
      DataClasses: ['Email addresses', 'Passwords'],
    }),
    // Date d'ajout avant la fuite : incohérence, écartée de la médiane.
    entry({ Name: 'Bizarre', BreachDate: '2024-01-10', AddedDate: '2023-12-01T00:00:00Z', PwnCount: 0 }),
    // Hors périmètre : étrangère, sans domaine, liste de spam, logiciel malveillant, fabriquée.
    entry({ Name: 'Etrangere', IsFrench: false, BreachDate: '2024-01-01', PwnCount: 5e9 }),
    entry({ Name: 'Compilation', Domain: '', BreachDate: '2024-01-01', PwnCount: 5e9 }),
    entry({ Name: 'Spam', IsSpamList: true, BreachDate: '2024-01-01', PwnCount: 5e9 }),
    entry({ Name: 'Malware', IsMalware: true, BreachDate: '2024-01-01', PwnCount: 5e9 }),
    entry({ Name: 'Fausse', IsFabricated: true, BreachDate: '2024-01-01', PwnCount: 5e9 }),
  ],
});

describe('breachStats', () => {
  const stats = breachStats(CATALOG);

  it('ne garde que les fuites qui ont une page', () => {
    expect(stats.count).toBe(4);
    expect(stats.overMillion).toBe(2);
    expect(stats.fetchedOn).toBe('2026-10-05');
  });

  it('compte par année de la fuite, années vides comprises', () => {
    expect(stats.byYear.map((y) => y.year)).toEqual([2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]);
    expect(stats.byYear.find((y) => y.year === 2024)).toEqual({ year: 2024, count: 2 });
    expect(stats.byYear.find((y) => y.year === 2016)).toEqual({ year: 2016, count: 0 });
  });

  it('classe les types de données, une fois par fuite, en français', () => {
    // Égalité à 3 : ordre alphabétique des libellés.
    expect(stats.dataTypes[0]).toEqual({ label: 'adresses e-mail', count: 3, share: 0.75, risky: false });
    expect(stats.dataTypes[1]).toMatchObject({ label: 'noms', count: 3 });
    expect(stats.dataTypes.find((d) => d.label === 'mots de passe')).toMatchObject({ count: 1, risky: true });
    expect(breachStats(CATALOG, { dataTypes: 2 }).dataTypes).toHaveLength(2);
  });

  it('compte les fuites avec mots de passe et données bancaires', () => {
    expect(stats.passwords).toEqual({ count: 1, share: 0.25 });
    expect(stats.bank).toEqual({ count: 1, share: 0.25 });
  });

  it('liste les plus grosses fuites avec leur page, sans les fuites à 0 compte', () => {
    expect(stats.biggest.map((b) => b.title)).toEqual(['Deezer', 'Free', 'Pokébip']);
    expect(stats.biggest[1]).toEqual({ title: 'Free', path: '/fuite/free', date: '2024-10-17', pwnCount: 13926173 });
  });

  it('calcule le délai médian entre la fuite et son ajout à HIBP', () => {
    // Free : 222 jours ; Deezer : 1351 ; Pokébip : 409. Médiane : 409.
    expect(stats.delaySample).toBe(3);
    expect(stats.medianDelayDays).toBe(409);
  });

  it('reste cohérent sans catalogue', () => {
    const empty = breachStats(EMPTY_CATALOG);
    expect(empty).toMatchObject({ count: 0, overMillion: 0, byYear: [], dataTypes: [], biggest: [] });
    expect(empty.passwords.share).toBe(0);
    expect(empty.medianDelayDays).toBeNull();
  });
});

describe('formats', () => {
  it('formatShare', () => {
    expect(formatShare(0.25)).toBe('25 %');
    expect(formatShare(0.003)).toBe('moins de 1 %');
    expect(formatShare(0)).toBe('0 %');
  });

  it('formatBigCount', () => {
    expect(formatBigCount(1_500_000)).toBe('1,5 million');
    expect(formatBigCount(243_621_110)).toBe('243,6 millions');
    expect(formatBigCount(2_100_000_000)).toBe('2,1 milliards');
    expect(formatBigCount(657_001)).toBe('657 001'.replace(' ', ' '));
  });

  it('formatDelay', () => {
    expect(formatDelay(1)).toBe('1 jour');
    expect(formatDelay(45)).toBe('45 jours');
    expect(formatDelay(409)).toBe('13 mois');
    expect(formatDelay(1351)).toBe('3 ans et 8 mois');
    expect(formatDelay(730)).toBe('2 ans');
  });
});
