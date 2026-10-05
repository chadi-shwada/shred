import { describe, expect, it } from 'vitest';
import { dataClassLabel, mapDataClasses, parseCatalog, searchBreaches } from './breaches';

const RAW = {
  fetchedOn: '2026-10-05',
  breaches: [
    {
      Name: 'Exemple',
      Title: 'Exemple Réseau',
      Domain: 'exemple.test',
      BreachDate: '2024-03-01',
      PwnCount: 1200,
      DataClasses: ['Email addresses', 'Passwords', 'Genders'],
      IsVerified: true,
      IsFabricated: false,
      IsSensitive: false,
      IsSpamList: false,
    },
    {
      Name: 'Autre',
      Title: 'Autre Boutique',
      Domain: 'boutique.test',
      BreachDate: '2025-06-10',
      PwnCount: 50,
      DataClasses: ['Names', 'Credit cards', 'Bank account numbers'],
      IsVerified: false,
    },
    { Name: 'SansDate', Title: 'Sans date' },
    'pas un objet',
  ],
};

describe('parseCatalog', () => {
  const catalog = parseCatalog(RAW);

  it('normalise les champs HIBP et ignore les entrées invalides', () => {
    expect(catalog.fetchedOn).toBe('2026-10-05');
    expect(catalog.breaches.map((b) => b.name)).toEqual(['Exemple', 'Autre']);
    expect(catalog.breaches[1]).toMatchObject({ title: 'Autre Boutique', verified: false, fabricated: false });
  });

  it('renvoie un catalogue vide pour un fichier absent ou abîmé', () => {
    expect(parseCatalog(undefined).breaches).toEqual([]);
    expect(parseCatalog({ breaches: 'non' }).breaches).toEqual([]);
    expect(parseCatalog({ breaches: [], fetchedOn: 'hier' }).fetchedOn).toBeNull();
  });
});

describe('mapDataClasses', () => {
  it('coche les cases connues et traduit le reste, sans doublon', () => {
    expect(
      mapDataClasses(['Email addresses', 'Passwords', 'Credit cards', 'Bank account numbers', 'Genders', 'Mystery']),
    ).toEqual({ categories: ['email', 'motDePasse', 'bancaire'], others: ['genre', 'Mystery'] });
  });

  it('traduit les libellés courants', () => {
    expect(dataClassLabel('Phone numbers')).toBe('numéros de téléphone');
    expect(dataClassLabel('Inconnu')).toBe('Inconnu');
  });
});

describe('searchBreaches', () => {
  const { breaches } = parseCatalog(RAW);

  it('sans requête : les plus récentes d’abord', () => {
    expect(searchBreaches(breaches, '').map((b) => b.name)).toEqual(['Autre', 'Exemple']);
  });

  it('cherche par nom ou domaine, sans tenir compte des accents ni de la casse', () => {
    expect(searchBreaches(breaches, 'RESEAU').map((b) => b.name)).toEqual(['Exemple']);
    expect(searchBreaches(breaches, 'boutique.test').map((b) => b.name)).toEqual(['Autre']);
    expect(searchBreaches(breaches, 'zzz')).toEqual([]);
  });

  it('place les débuts de nom devant les correspondances internes', () => {
    expect(searchBreaches(breaches, 'e').map((b) => b.name)).toEqual(['Exemple', 'Autre']);
  });

  it('respecte la limite', () => {
    expect(searchBreaches(breaches, '', 1)).toHaveLength(1);
  });
});
