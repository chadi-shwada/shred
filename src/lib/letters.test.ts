import { describe, expect, it } from 'vitest';
import { generateLetter, letterToText, LetterInputError, mailtoHref, type LetterInput } from './letters';

const base: LetterInput = {
  kind: 'effacement',
  fullName: 'Camille Martin',
  email: 'camille@example.org',
  siteName: 'exemple-fuites.test',
  urls: ['https://exemple-fuites.test/dump/123', '  ', ' https://exemple-fuites.test/dump/456 '],
  dataCategories: ['email', 'motDePasse'],
  otherData: '  numéro client  ',
  date: '2026-10-05',
};

describe('lettre d’effacement', () => {
  const letter = generateLetter(base);

  it('cite les articles du RGPD dans l’ordre', () => {
    expect(letter.articles).toEqual(['17.1', '17.2', '19', '12.3', '12.5', '77']);
    expect(letter.subject).toBe("Demande d'effacement de données personnelles (article 17 du RGPD)");
  });

  it('fonde la demande sur l’article 17.1 d) et le règlement complet', () => {
    expect(letter.body).toContain("l'article 17.1 du règlement (UE) 2016/679 (RGPD)");
    expect(letter.body).toContain("point d) (données ayant fait l'objet d'un traitement illicite)");
  });

  it('demande l’information des autres responsables (17.2) et des destinataires (19)', () => {
    expect(letter.body).toContain("conformément à l'article 17.2 du RGPD");
    expect(letter.body).toContain("Conformément à l'article 19 du RGPD");
  });

  it('rappelle le délai d’un mois, la gratuité et la CNIL', () => {
    expect(letter.body).toContain("délai d'un mois à compter de la réception");
    expect(letter.body).toContain('article 12.5 du RGPD');
    expect(letter.body).toContain("conformément à l'article 77 du RGPD");
  });

  it('liste les adresses et les données en ignorant les lignes vides', () => {
    expect(letter.body).toContain('- https://exemple-fuites.test/dump/123\n- https://exemple-fuites.test/dump/456\n');
    expect(letter.body).toContain('- adresse e-mail\n- mot de passe ou son empreinte (hash)\n- numéro client');
  });

  it('commence par la formule d’appel et finit par la signature datée', () => {
    expect(letter.body.startsWith('Madame, Monsieur,\n\n')).toBe(true);
    expect(letter.body.endsWith('Camille Martin\ncamille@example.org\n\nLe 5 octobre 2026')).toBe(true);
  });

  it('omet les paragraphes facultatifs vides', () => {
    const minimal = generateLetter({ kind: 'effacement', fullName: 'A', siteName: 'S', date: '2026-10-05' });
    expect(minimal.body).not.toContain('adresses suivantes');
    expect(minimal.body).not.toContain('Les données concernées');
    expect(minimal.body).not.toContain('retrouver ces données');
    expect(minimal.body).not.toMatch(/\n{3,}/);
  });
});

describe('lettre d’accès', () => {
  const letter = generateLetter({ ...base, kind: 'acces' });

  it('cite l’article 15, la copie et la source des données', () => {
    expect(letter.articles).toEqual(['15', '15.3', '15.1 g', '12.3', '12.5', '77']);
    expect(letter.body).toContain("l'article 15 du règlement (UE) 2016/679 (RGPD)");
    expect(letter.body).toContain('copie (article 15.3)');
    expect(letter.body).toContain('source de ces données');
    expect(letter.body).toContain('(article 15.1 g)');
  });

  it('ne demande pas d’effacement', () => {
    expect(letter.body).not.toContain('17.1');
  });
});

describe('lettre de relance', () => {
  const input: LetterInput = {
    ...base,
    kind: 'relance',
    previousKind: 'effacement',
    previousRequestDate: '2026-01-31',
    date: '2026-03-10',
  };
  const letter = generateLetter(input);

  it('rappelle la première demande et son fondement', () => {
    expect(letter.subject).toBe("Relance : demande d'effacement de mes données personnelles (article 17 du RGPD)");
    expect(letter.body).toContain('Le 31 janvier 2026, je vous ai adressé');
    expect(letter.body).toContain("fondée sur l'article 17 du règlement (UE) 2016/679 (RGPD)");
  });

  it('calcule l’échéance de l’article 12.3 en fin de mois', () => {
    expect(letter.body).toContain('au plus tard vers le 28 février 2026');
  });

  it('cite les articles 12.4 et 77', () => {
    expect(letter.articles).toEqual(['17', '12.3', '12.4', '77']);
    expect(letter.body).toContain("l'article 12.4 du RGPD vous oblige");
    expect(letter.body).toContain("j'introduirai une réclamation");
  });

  it('s’adapte à une première demande d’accès', () => {
    const access = generateLetter({ ...input, previousKind: 'acces' });
    expect(access.articles[0]).toBe('15');
    expect(access.subject).toContain("demande d'accès");
  });

  it('exige la date et la nature de la première demande', () => {
    expect(() => generateLetter({ ...input, previousRequestDate: undefined })).toThrow(LetterInputError);
    expect(() => generateLetter({ ...input, previousKind: undefined })).toThrow(LetterInputError);
  });
});

describe('validation', () => {
  it('exige un nom et un site', () => {
    expect(() => generateLetter({ ...base, fullName: '  ' })).toThrow(LetterInputError);
    expect(() => generateLetter({ ...base, siteName: '' })).toThrow(LetterInputError);
  });
});

describe('contexte « violation » (fuite subie par l’entreprise)', () => {
  const violation: LetterInput = {
    kind: 'effacement',
    fullName: 'Camille Martin',
    siteName: 'Exemple SA',
    dataCategories: ['email', 'motDePasse'],
    date: '2026-10-05',
    context: 'violation',
    breachName: 'Exemple',
    breachDate: '2024-03-01',
  };

  it('effacement : art. 17.1 a et b, 19, 34, 34.2, 33.3, sans 17.2 ni 17.1 d', () => {
    const letter = generateLetter(violation);
    expect(letter.articles).toEqual(['17.1', '19', '34', '34.2', '33.3', '12.3', '12.5', '77']);
    expect(letter.body).toContain(
      'violation de données subie par Exemple SA (référencée sous le nom « Exemple », datée du 1er mars 2024).',
    );
    expect(letter.body).toContain('(point a)');
    expect(letter.body).toContain('(point b)');
    expect(letter.body).not.toContain('point d)');
    expect(letter.body).not.toContain('17.2');
    expect(letter.body).toContain("l'article 34 du RGPD vous impose de m'en informer");
    expect(letter.body).toContain("(article 34.2, qui renvoie à l'article 33.3)");
    expect(letter.body).toContain("D'après les informations publiques sur cette fuite");
  });

  it('accès : art. 15 et 15.3, données touchées, sans la source (15.1 g)', () => {
    const letter = generateLetter({ ...violation, kind: 'acces' });
    expect(letter.articles).toEqual(['15', '15.3', '34', '34.2', '33.3', '12.3', '12.5', '77']);
    expect(letter.body).toContain('la liste précise des données me concernant touchées par cette violation.');
    expect(letter.body).not.toContain('15.1 g');
  });

  it('relance : rappelle la violation', () => {
    const letter = generateLetter({
      ...violation,
      kind: 'relance',
      previousKind: 'acces',
      previousRequestDate: '2026-08-01',
    });
    expect(letter.body).toContain("exposées lors d'une violation de données subie par Exemple SA");
    expect(letter.body).not.toContain('diffusées sur le site');
  });

  it('référence partielle : nom seul, date seule, ou rien', () => {
    const nameOnly = generateLetter({ ...violation, breachDate: undefined });
    expect(nameOnly.body).toContain('subie par Exemple SA (référencée sous le nom « Exemple »).');
    const dateOnly = generateLetter({ ...violation, breachName: ' ' });
    expect(dateOnly.body).toContain('subie par Exemple SA (datée du 1er mars 2024).');
    const none = generateLetter({ ...violation, breachName: undefined, breachDate: undefined });
    expect(none.body).toContain('subie par Exemple SA.');
  });

  it('le contexte par défaut reste « exposition »', () => {
    expect(generateLetter({ ...violation, context: undefined }).articles).toContain('17.2');
  });
});

describe('style des lettres', () => {
  const kinds = ['effacement', 'acces', 'relance'] as const;
  const contexts = ['exposition', 'violation'] as const;
  for (const context of contexts)
    for (const kind of kinds) {
      it(`${context}, ${kind} : pas de « veuillez », pas de « simplement », pas d’apostrophe typographique mélangée`, () => {
        const { subject, body } = generateLetter({
          ...base,
          kind,
          context,
          breachName: 'Exemple',
          breachDate: '2024-03-01',
          previousKind: 'effacement',
          previousRequestDate: '2026-09-01',
        });
        const text = `${subject}\n${body}`;
        expect(text).not.toMatch(/veuillez/i);
        expect(text).not.toMatch(/simplement/i);
        expect(text).not.toContain('’');
      });
    }
});

describe('sorties', () => {
  const letter = generateLetter(base);

  it('letterToText place l’objet en tête', () => {
    expect(letterToText(letter).startsWith(`Objet : ${letter.subject}\n\nMadame, Monsieur,`)).toBe(true);
  });

  it('mailtoHref encode l’objet et le corps', () => {
    const href = mailtoHref(letter, ' dpo@exemple.test ');
    expect(href.startsWith('mailto:dpo@exemple.test?subject=')).toBe(true);
    expect(decodeURIComponent(href.split('&body=')[1] ?? '')).toBe(letter.body);
  });

  it('mailtoHref neutralise les caractères qui casseraient le lien', () => {
    expect(mailtoHref(letter, 'a@b.test?cc=x').startsWith('mailto:a@b.testcc=x?')).toBe(true);
  });
});
