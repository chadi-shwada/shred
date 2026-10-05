/**
 * Test d'un mot de passe contre Pwned Passwords, par k-anonymat.
 *
 * L'empreinte SHA-1 est calculée localement ; seuls ses 5 premiers caractères
 * hexadécimaux partent vers api.pwnedpasswords.com. La réponse (environ 800
 * suffixes, plus le remplissage demandé par Add-Padding) est comparée localement.
 * Le mot de passe et l'empreinte complète ne quittent jamais le navigateur.
 */

export const PWNED_ORIGIN = 'https://api.pwnedpasswords.com';

export async function sha1Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export function splitHash(hash: string): { prefix: string; suffix: string } {
  return { prefix: hash.slice(0, 5), suffix: hash.slice(5) };
}

/** Nombre d'occurrences du suffixe dans une réponse « SUFFIXE:COMPTE » par ligne (0 si absent). */
export function countInRange(body: string, suffix: string): number {
  const wanted = suffix.toUpperCase();
  for (const line of body.split(/\r?\n/)) {
    const [candidate, count] = line.trim().split(':');
    if (candidate?.toUpperCase() === wanted) return Number.parseInt(count ?? '0', 10) || 0;
  }
  return 0;
}

export type Fetcher = (url: string, init?: RequestInit) => Promise<Pick<Response, 'ok' | 'status' | 'text'>>;

export class PwnedServiceError extends Error {}

async function fetchRange(prefix: string, fetcher: Fetcher): Promise<string> {
  const url = `${PWNED_ORIGIN}/range/${prefix}`;
  let response;
  try {
    response = await fetcher(url, { headers: { 'Add-Padding': 'true' }, referrerPolicy: 'no-referrer' });
  } catch {
    // Si l'en-tête de remplissage est refusé (pré-vérification CORS), on retente sans lui.
    try {
      response = await fetcher(url, { referrerPolicy: 'no-referrer' });
    } catch {
      throw new PwnedServiceError('Le service Pwned Passwords ne répond pas.');
    }
  }
  if (!response.ok) throw new PwnedServiceError(`Le service Pwned Passwords a répondu ${response.status}.`);
  return response.text();
}

/** Nombre de fois où ce mot de passe apparaît dans des fuites connues. */
export async function pwnedCount(password: string, fetcher: Fetcher): Promise<number> {
  if (!password) return 0;
  const { prefix, suffix } = splitHash(await sha1Hex(password));
  return countInRange(await fetchRange(prefix, fetcher), suffix);
}
