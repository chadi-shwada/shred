import { describe, expect, it } from 'vitest';
import {
  dataClassLabel,
  hibpBreachUrl,
  mapDataClasses,
  newFrenchBreachesSince,
  parseCatalog,
  searchBreaches,
} from './breaches';

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

describe('fiche HIBP et nouveautés', () => {
  const { breaches } = parseCatalog({
    breaches: [
      { Name: 'Vieille', BreachDate: '2020-01-01', AddedDate: '2026-01-10T10:00:00Z', Domain: 'a.fr', IsFrench: true },
      { Name: 'Nouvelle', BreachDate: '2026-08-01', AddedDate: '2026-09-20T08:00:00Z', Domain: 'b.fr', IsFrench: true },
      {
        Name: 'Étrangère',
        BreachDate: '2026-08-01',
        AddedDate: '2026-09-21T08:00:00Z',
        Domain: 'c.com',
        IsFrench: false,
      },
      { Name: 'Malware', BreachDate: '2026-08-01', AddedDate: '2026-09-22T08:00:00Z', IsFrench: true, IsMalware: true },
    ],
  });

  it('lit la date d’ajout', () => {
    expect(breaches[1]?.addedDate).toBe('2026-09-20');
  });

  it('liste les fuites françaises ajoutées depuis la dernière visite', () => {
    expect(newFrenchBreachesSince(breaches, '2026-09-01').map((b) => b.name)).toEqual(['Nouvelle']);
    expect(newFrenchBreachesSince(breaches, '2025-12-31').map((b) => b.name)).toEqual(['Nouvelle', 'Vieille']);
    expect(newFrenchBreachesSince(breaches, null)).toEqual([]);
  });

  it('pointe vers la fiche publique HIBP', () => {
    expect(hibpBreachUrl(breaches[2]!)).toBe('https://haveibeenpwned.com/Breach/%C3%89trang%C3%A8re');
  });
});
