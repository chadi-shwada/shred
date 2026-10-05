/** Outils pour retrouver qui se cache derrière un site (registrar, hébergeur). */

/** Extrait le nom d'hôte d'une saisie libre (« https://www.exemple.com/page » → « exemple.com »), ou null. */
export function extractDomain(input: string): string | null {
  const raw = input.trim().toLowerCase();
  if (!raw) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//.test(raw) ? raw : `https://${raw}`;
  let host: string;
  try {
    host = new URL(withScheme).hostname;
  } catch {
    return null;
  }
  host = host.replace(/^www\./, '').replace(/\.$/, '');
  // Il faut au moins un point et une extension alphabétique (pas d'adresse IP ni de simple mot).
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(host) && !/^xn--/.test(host.split('.').pop() ?? '')) return null;
  return host;
}

/** Recherche WHOIS/RDAP officielle de l'ICANN : registrar et contact d'abus du domaine. */
export function icannLookupUrl(domain: string): string {
  return `https://lookup.icann.org/en/lookup?name=${encodeURIComponent(domain)}`;
}

export const CLOUDFLARE_ABUSE_URL = 'https://abuse.cloudflare.com';
