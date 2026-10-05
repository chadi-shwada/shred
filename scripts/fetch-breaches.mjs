/**
 * Télécharge au build le catalogue public des fuites de Have I Been Pwned
 * (métadonnées seulement, licence CC BY 4.0) et l'écrit dans
 * src/data/breaches.generated.json, embarqué dans le site.
 *
 * Aucune donnée personnelle n'est envoyée : c'est une requête anonyme vers
 * un point d'accès public, faite par la machine de build, pas par les visiteurs.
 * En cas d'échec, le build continue : le site affiche « liste indisponible ».
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { isFrenchBreach } from './french.mjs';

const URL_BREACHES = 'https://haveibeenpwned.com/api/v3/breaches';
const OUTPUT = fileURLToPath(new URL('../src/data/breaches.generated.json', import.meta.url));
const FIELDS = [
  'Name',
  'Title',
  'Domain',
  'BreachDate',
  'AddedDate',
  'PwnCount',
  'DataClasses',
  'IsVerified',
  'IsFabricated',
  'IsSensitive',
  'IsSpamList',
  'IsMalware',
];

try {
  const response = await fetch(URL_BREACHES, {
    headers: { 'User-Agent': 'Shred-build (https://github.com/chadi-shwada/shred)' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const raw = await response.json();
  if (!Array.isArray(raw)) throw new Error('réponse inattendue');
  // La description n'est pas embarquée (trop lourde) : on n'en garde que l'indice « fuite française ».
  const breaches = raw.map((b) => ({
    ...Object.fromEntries(FIELDS.filter((f) => f in b).map((f) => [f, b[f]])),
    IsFrench: isFrenchBreach(b),
  }));
  const french = breaches.filter((b) => b.IsFrench).length;
  const fetchedOn = new Date().toISOString().slice(0, 10);
  await writeFile(OUTPUT, JSON.stringify({ fetchedOn, breaches }) + '\n');
  console.log(`[fetch-breaches] ${breaches.length} fuites enregistrées dont ${french} françaises (${fetchedOn}).`);
} catch (error) {
  console.warn(`[fetch-breaches] Catalogue non téléchargé : ${error.message}. Le build continue sans.`);
}
