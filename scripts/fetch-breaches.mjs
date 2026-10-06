/**
 * Télécharge au build le catalogue public des fuites de Have I Been Pwned
 * (métadonnées seulement, licence CC BY 4.0) et l'écrit dans
 * src/data/breaches.generated.json, embarqué dans le site.
 *
 * Aucune donnée personnelle n'est envoyée : c'est une requête anonyme vers
 * un point d'accès public, faite par la machine de build, pas par les visiteurs.
 * En cas d'échec, le build continue : le site affiche « liste indisponible ».
 * Télécharge aussi les logos des fuites françaises (scripts/breach-logos.mjs).
 */

import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { downloadLogos } from './breach-logos.mjs';
import { isFrenchBreach } from './french.mjs';

const URL_BREACHES = 'https://haveibeenpwned.com/api/v3/breaches';
const OUTPUT = fileURLToPath(new URL('../src/data/breaches.generated.json', import.meta.url));
const LOGOS_DIR = fileURLToPath(new URL('../public/logos', import.meta.url));
const LOGOS_MANIFEST = fileURLToPath(new URL('../src/data/breach-logos.generated.json', import.meta.url));
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
    headers: { 'User-Agent': 'ShredRGPD-build (https://github.com/chadi-shwada/shredrgpd)' },
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
  // Logos des entreprises (fuites françaises) : servis par le site, jamais chargés chez HIBP par les visiteurs.
  const withFrench = raw.map((b, i) => ({ ...b, IsFrench: breaches[i].IsFrench }));
  const logos = await downloadLogos(withFrench, LOGOS_DIR);
  await writeFile(LOGOS_MANIFEST, JSON.stringify(logos) + '\n');
  const light = Object.keys(logos).filter((name) => logos[name].light);
  console.log(
    `[fetch-breaches] ${Object.keys(logos).length} logos enregistrés` +
      (light.length > 0 ? `, dont ${light.length} clairs sur fond sombre (${light.join(', ')}).` : '.'),
  );
} catch (error) {
  console.warn(`[fetch-breaches] Catalogue non téléchargé : ${error.message}. Le build continue sans.`);
}
