import { describe, expect, it } from 'vitest';
import { CHARSETS, entropyBits, generatePassword } from './password';

describe('generatePassword', () => {
  it('respecte la longueur et contient chaque famille choisie', () => {
    for (let n = 0; n < 50; n++) {
      const pw = generatePassword(16);
      expect(pw).toHaveLength(16);
      for (const set of Object.values(CHARSETS)) expect([...pw].some((c) => set.includes(c))).toBe(true);
    }
  });

  it('se limite aux familles demandées', () => {
    const pw = generatePassword(30, ['chiffres']);
    expect(pw).toMatch(/^[2-9]{30}$/);
  });

  it('écarte les caractères ambigus (0, O, 1, l, I)', () => {
    const all = Array.from({ length: 30 }, () => generatePassword(40)).join('');
    expect(all).not.toMatch(/[0O1lI]/);
  });

  it('rejette les tirages qui biaiseraient le modulo', () => {
    // 13 symboles : 2^32 n'est pas divisible par 13, la valeur maximale tombe au-delà de la
    // limite et doit être rejetée (avec 8 chiffres, puissance de 2, il n'y a rien à rejeter).
    const values = [0xffffffff, 3];
    let i = 0;
    const random = (a: Uint32Array<ArrayBuffer>) => {
      a[0] = values[Math.min(i++, values.length - 1)] ?? 0;
      return a;
    };
    expect(generatePassword(1, ['symboles'], random)).toBe(CHARSETS.symboles[3]);
    expect(i).toBe(2);
  });

  it('refuse une configuration impossible', () => {
    expect(() => generatePassword(10, [])).toThrow();
    expect(() => generatePassword(2, ['minuscules', 'majuscules', 'chiffres'])).toThrow();
  });
});

describe('entropyBits', () => {
  it('calcule l’entropie', () => {
    expect(entropyBits(20, ['minuscules', 'majuscules', 'chiffres', 'symboles'])).toBe(Math.round(20 * Math.log2(70)));
    expect(entropyBits(10, [])).toBe(0);
  });
});
