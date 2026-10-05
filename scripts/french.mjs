/**
 * Heuristique « fuite française » : Have I Been Pwned n'indique pas de pays.
 * On retient une fuite si son domaine est en .fr ou si sa description (en
 * anglais) mentionne la France (« French », « France »).
 * Partagé par scripts/fetch-breaches.mjs et testé dans src/lib/french.test.ts.
 */

const FRENCH_TEXT = /\b(French|France)\b/;

/**
 * Entreprises françaises dont la description HIBP ne cite pas la France
 * (repérées en vérifiant le catalogue du 5 octobre 2026).
 */
const KNOWN_FRENCH_DOMAINS = new Set(['dailymotion.com', 'deezer.com']);

export function isFrenchBreach({ Domain, Description }) {
  const domain = typeof Domain === 'string' ? Domain.trim().toLowerCase() : '';
  if (domain.endsWith('.fr') || KNOWN_FRENCH_DOMAINS.has(domain)) return true;
  if (typeof Description === 'string' && FRENCH_TEXT.test(Description)) return true;
  return false;
}
