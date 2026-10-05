/**
 * Heuristique « fuite française » : Have I Been Pwned n'indique pas de pays.
 * On retient une fuite si son domaine est en .fr ou si sa description (en
 * anglais) mentionne la France (« French », « France »).
 * Partagé par scripts/fetch-breaches.mjs et testé dans src/lib/french.test.ts.
 */

const FRENCH_TEXT = /\b(French|France)\b/;

export function isFrenchBreach({ Domain, Description }) {
  if (typeof Domain === 'string' && /\.fr$/i.test(Domain.trim())) return true;
  if (typeof Description === 'string' && FRENCH_TEXT.test(Description)) return true;
  return false;
}
