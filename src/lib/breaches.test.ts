import { describe, expect, it } from 'vitest';
import {
  dataClassLabel,
  findBreachesInText,
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

describe('findBreachesInText', () => {
  const { breaches } = parseCatalog({
    breaches: [
      { Name: 'FreeMobile', Title: 'Free', BreachDate: '2024-10-17' },
      { Name: 'Dominos', Title: "Domino's", BreachDate: '2014-06-13' },
      { Name: 'DominosIndia', Title: "Domino's India", BreachDate: '2021-04-01' },
      { Name: 'ZadigVoltaire', Title: 'Zadig & Voltaire', BreachDate: '2023-11-16' },
      { Name: 'Cultura', Title: 'Cultura', BreachDate: '2024-09-06' },
      { Name: 'Deezer', Title: 'Deezer', BreachDate: '2019-04-22' },
      { Name: 'Twin1', Title: 'Jumeau', BreachDate: '2020-01-01' },
      { Name: 'Twin2', Title: 'Jumeau', BreachDate: '2021-01-01' },
    ],
  });
  const names = (text: string) => findBreachesInText(breaches, text).map((m) => m.breach.name);

  it("repère les fuites d'une page de résultats, dans l'ordre d'apparition", () => {
    const page = 'Oh no — pwned!\nCultura\nIn September 2024, Cultura…\nZadig & Voltaire\nIn November 2023…';
    expect(names(page)).toEqual(['Cultura', 'ZadigVoltaire']);
  });

  it('exige le nom exact, casse comprise, comme mot entier', () => {
    expect(names('free service, Freelance, Deezers, cultura')).toEqual([]);
    expect(names('(Deezer)')).toEqual(['Deezer']);
  });

  it('accepte les apostrophes typographiques et les espaces insécables', () => {
    expect(names('Domino’s India')).toEqual(['DominosIndia']);
  });

  it('ignore un nom contenu dans un nom plus long, mais pas ailleurs dans le texte', () => {
    expect(names("Domino's India")).toEqual(['DominosIndia']);
    expect(names("Domino's India puis Domino's")).toEqual(['DominosIndia', 'Dominos']);
  });

  it("ne coche d'office que les noms affichés comme un titre et portés par une seule fuite", () => {
    const certain = (text: string) =>
      findBreachesInText(breaches, text).map((m) => [m.breach.name, m.certain] as [string, boolean]);
    expect(certain('Free\nJumeau\n  Deezer  \nCultura: In 2024, Cultura…')).toEqual([
      ['FreeMobile', true],
      ['Twin1', false],
      ['Twin2', false],
      ['Deezer', true],
      ['Cultura', true],
    ]);
    // Cité dans une phrase ou un pied de page : à confirmer.
    expect(certain('Suivre Deezer, Cultura et Free')).toEqual([
      ['Deezer', false],
      ['Cultura', false],
      ['FreeMobile', false],
    ]);
    // Un nom court suivi de « : » peut être un libellé de la page.
    expect(certain('Free: offre')).toEqual([['FreeMobile', false]]);
  });

  it('renvoie une liste vide pour un texte vide', () => {
    expect(findBreachesInText(breaches, '   ')).toEqual([]);
  });
});
