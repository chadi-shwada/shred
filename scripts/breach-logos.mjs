/**
 * Logos des entreprises touchées, téléchargés au build depuis Have I Been
 * Pwned (champ LogoPath) et servis par le site lui-même : les visiteurs ne
 * font aucune requête externe (règle n° 1). Seulement les fuites françaises
 * avec une entreprise identifiée, et seulement des images matricielles
 * (PNG, JPEG, GIF, WebP) vérifiées par leur signature : pas de SVG, qui peut
 * contenir du code. Sans logo, le site affiche un médaillon (BreachMark).
 * Un logo clair sur fond transparent (isLightLogo) est noté « light » : le
 * site et les images de partage le posent sur un fond sombre.
 * Les logos sont des marques de leurs propriétaires.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { decodeLogo, isLightLogo } from './og-logos.mjs';

/** Poids maximal d'un logo. */
export const MAX_LOGO_BYTES = 300_000;

/** Fuites qui reçoivent un logo : mêmes critères que les pages de fuite. */
export function logoTargets(rawBreaches) {
  return rawBreaches.filter(
    (b) =>
      b.IsFrench &&
      typeof b.Domain === 'string' &&
      b.Domain.trim() !== '' &&
      !b.IsMalware &&
      !b.IsSpamList &&
      !b.IsFabricated &&
      typeof b.LogoPath === 'string' &&
      b.LogoPath.startsWith('https://'),
  );
}

/** Type d'image d'après les premiers octets ; null si ce n'est pas une image acceptée. */
export function imageType(bytes) {
  const b = bytes;
  if (b.length >= 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'jpg';
  if (b.length >= 6 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return 'gif';
  if (
    b.length >= 12 &&
    b[0] === 0x52 &&
    b[1] === 0x49 &&
    b[2] === 0x46 &&
    b[3] === 0x46 &&
    b[8] === 0x57 &&
    b[9] === 0x45 &&
    b[10] === 0x42 &&
    b[11] === 0x50
  ) {
    return 'webp';
  }
  return null;
}

/** Nom de fichier sûr tiré du nom HIBP (lettres, chiffres, tiret, soulignement). */
export function logoFileName(name, type) {
  return `${name.replace(/[^A-Za-z0-9_-]/g, '')}.${type}`;
}

/** Logo clair sur fond transparent ? Faux si l'image ne se décode pas (GIF, WebP). */
function lightness(bytes) {
  try {
    const img = decodeLogo(bytes);
    return img ? isLightLogo(img) : false;
  } catch {
    return false;
  }
}

/**
 * Télécharge les logos dans outDir et renvoie
 * { Name: { src: "/logos/Free.png", light: false } }.
 * Chaque échec est ignoré : la fuite garde son médaillon.
 */
export async function downloadLogos(rawBreaches, outDir, { fetchImpl = fetch, log = console } = {}) {
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });
  const manifest = {};
  const targets = logoTargets(rawBreaches);
  await Promise.all(
    targets.map(async (b) => {
      try {
        const response = await fetchImpl(b.LogoPath, { signal: AbortSignal.timeout(15_000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        if (bytes.length > MAX_LOGO_BYTES) throw new Error('trop lourd');
        const type = imageType(bytes);
        if (!type) throw new Error('format refusé');
        const file = logoFileName(b.Name, type);
        await writeFile(`${outDir}/${file}`, bytes);
        manifest[b.Name] = { src: `/logos/${file}`, light: lightness(bytes) };
      } catch (error) {
        log.warn(`[fetch-breaches] Logo de ${b.Name} ignoré : ${error.message}.`);
      }
    }),
  );
  return manifest;
}
