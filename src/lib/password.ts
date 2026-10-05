/**
 * Générateur de mot de passe, entièrement local (crypto.getRandomValues).
 * Tirage sans biais par rejet ; au moins un caractère de chaque famille choisie.
 */

export const CHARSETS = {
  minuscules: 'abcdefghijkmnopqrstuvwxyz',
  majuscules: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  chiffres: '23456789',
  symboles: '!#$%&*+-=?@_~',
} as const;

export type Charset = keyof typeof CHARSETS;

export type RandomSource = (array: Uint32Array<ArrayBuffer>) => Uint32Array<ArrayBuffer>;

const defaultRandom: RandomSource = (array) => crypto.getRandomValues(array);

/** Entier uniforme dans [0, max[, par rejet pour éviter le biais du modulo. */
function randomIndex(max: number, random: RandomSource): number {
  const limit = Math.floor(0x1_0000_0000 / max) * max;
  const buffer = new Uint32Array(1);
  for (;;) {
    const value = random(buffer)[0] ?? 0;
    if (value < limit) return value % max;
  }
}

export function generatePassword(
  length = 20,
  sets: Charset[] = ['minuscules', 'majuscules', 'chiffres', 'symboles'],
  random: RandomSource = defaultRandom,
): string {
  if (sets.length === 0) throw new Error('Choisis au moins une famille de caractères.');
  if (length < sets.length) throw new Error('Mot de passe trop court pour les familles choisies.');
  const pool = sets.map((s) => CHARSETS[s]).join('');
  const chars = sets.map((s) => CHARSETS[s][randomIndex(CHARSETS[s].length, random)] as string);
  while (chars.length < length) chars.push(pool[randomIndex(pool.length, random)] as string);
  // Mélange de Fisher-Yates pour ne pas laisser les caractères imposés en tête.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomIndex(i + 1, random);
    [chars[i], chars[j]] = [chars[j] as string, chars[i] as string];
  }
  return chars.join('');
}

/** Entropie en bits, pour indiquer la robustesse. */
export function entropyBits(length: number, sets: Charset[]): number {
  const size = sets.reduce((n, s) => n + CHARSETS[s].length, 0);
  return size > 0 ? Math.round(length * Math.log2(size)) : 0;
}
