import { describe, expect, it } from 'vitest';
import { parseCatalog } from './breaches';
import { generateLetter } from './letters';
import { breachLetterInput, breachLetterQuery, parseCategories } from './letterLink';

const [breach] = parseCatalog({
  breaches: [
    {
      Name: 'Exemple2024',
      Title: 'Exemple',
      Domain: 'exemple.test',
      BreachDate: '2024-03-01',
      DataClasses: ['Email addresses', 'Passwords', 'Genders'],
    },
  ],
}).breaches;

describe('breachLetterQuery', () => {
  it('pré-remplit une lettre « violation » avec les données exposées', () => {
    expect(breachLetterQuery(breach!, 'acces')).toEqual({
      type: 'acces',
      contexte: 'violation',
      site: 'Exemple',
      fuite: 'Exemple2024',
      'date-fuite': '2024-03-01',
      donnees: 'email,motDePasse',
      autres: 'genre',
    });
  });

  it('omet le nom de la fuite s’il répète le titre', () => {
    expect(breachLetterQuery({ ...breach!, name: 'EXEMPLE' }, 'effacement')).not.toHaveProperty('fuite');
  });
});

describe('parseCategories', () => {
  it('garde les catégories connues, sans doublon', () => {
    expect(parseCategories('email, motDePasse,inconnu,email')).toEqual(['email', 'motDePasse']);
    expect(parseCategories(null)).toEqual([]);
  });
});

describe('breachLetterInput', () => {
  it('produit la même lettre que le générateur pré-rempli', () => {
    const input = breachLetterInput(breach!, 'acces', { fullName: 'Camille' }, '2026-10-05');
    expect(input).toMatchObject({
      kind: 'acces',
      context: 'violation',
      siteName: 'Exemple',
      breachName: 'Exemple2024',
      breachDate: '2024-03-01',
      dataCategories: ['email', 'motDePasse'],
      otherData: 'genre',
    });
    const letter = generateLetter(input);
    expect(letter.body).toContain('violation de données subie par Exemple');
    expect(letter.body).toContain('- mot de passe ou son empreinte (hash)');
  });
});
