/**
 * Au build, colle le logo de l'entreprise (public/logos/, téléchargé par
 * fetch-breaches.mjs) dans l'image de partage de chaque page de fuite, à la
 * place du médaillon : carré blanc arrondi, logo centré. Les images de base
 * et la position du médaillon (public/og/marks.json) viennent de
 * scripts/og-images.mjs. Résultat dans public/og-logo/ (non versionné) ;
 * vite.config.ts le préfère à public/og/ quand il existe. Sans logo, l'image
 * de base reste. JavaScript pur (jpeg-js, pngjs) : rien de natif à installer.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import jpeg from 'jpeg-js';
import { PNG } from 'pngjs';

/** Part de la taille du médaillon laissée en marge autour du logo. */
const PADDING = 0.14;

const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** Couverture (0 à 1) d'un pixel par un carré arrondi, avec anticrénelage. */
function roundedCoverage(px, py, x, y, size, r) {
  const cx = Math.min(Math.max(px, x + r), x + size - r);
  const cy = Math.min(Math.max(py, y + r), y + size - r);
  const d = Math.hypot(px - cx, py - cy);
  const inside = px >= x && px <= x + size && py >= y && py <= y + size;
  if (!inside) return 0;
  return clamp01(r - d + 0.5);
}

/** Échantillon bilinéaire RGBA (couleurs prémultipliées par l'alpha). */
function sample(img, fx, fy) {
  const x0 = Math.max(0, Math.min(img.width - 1, Math.floor(fx)));
  const y0 = Math.max(0, Math.min(img.height - 1, Math.floor(fy)));
  const x1 = Math.min(img.width - 1, x0 + 1);
  const y1 = Math.min(img.height - 1, y0 + 1);
  const tx = clamp01(fx - x0);
  const ty = clamp01(fy - y0);
  const out = [0, 0, 0, 0];
  for (const [xx, yy, w] of [
    [x0, y0, (1 - tx) * (1 - ty)],
    [x1, y0, tx * (1 - ty)],
    [x0, y1, (1 - tx) * ty],
    [x1, y1, tx * ty],
  ]) {
    const i = (yy * img.width + xx) * 4;
    const a = (img.data[i + 3] / 255) * w;
    out[0] += img.data[i] * a;
    out[1] += img.data[i + 1] * a;
    out[2] += img.data[i + 2] * a;
    out[3] += a;
  }
  return out;
}

/**
 * Dessine un carré blanc arrondi sur base (RGBA) à l'emplacement du médaillon,
 * puis le logo centré dedans, réduit pour tenir dans la marge. Modifie base.
 */
export function compositeLogo(base, mark, logo) {
  const { x, y, size, radius } = mark;
  // Carré blanc, un pixel plus large pour couvrir le bord du médaillon d'origine.
  for (let py = y - 1; py <= y + size + 1; py++) {
    for (let px = x - 1; px <= x + size + 1; px++) {
      if (px < 0 || py < 0 || px >= base.width || py >= base.height) continue;
      const c = roundedCoverage(px + 0.5, py + 0.5, x - 1, y - 1, size + 2, radius + 1);
      if (c === 0) continue;
      const i = (py * base.width + px) * 4;
      for (let k = 0; k < 3; k++) base.data[i + k] = Math.round(base.data[i + k] * (1 - c) + 255 * c);
    }
  }
  const inner = size * (1 - 2 * PADDING);
  const scale = Math.min(inner / logo.width, inner / logo.height);
  const w = logo.width * scale;
  const h = logo.height * scale;
  const ox = x + (size - w) / 2;
  const oy = y + (size - h) / 2;
  for (let py = Math.floor(oy); py < Math.ceil(oy + h); py++) {
    for (let px = Math.floor(ox); px < Math.ceil(ox + w); px++) {
      if (px < 0 || py < 0 || px >= base.width || py >= base.height) continue;
      const [r, g, b, a] = sample(logo, (px + 0.5 - ox) / scale - 0.5, (py + 0.5 - oy) / scale - 0.5);
      if (a <= 0) continue;
      const i = (py * base.width + px) * 4;
      base.data[i] = Math.round(r + base.data[i] * (1 - a));
      base.data[i + 1] = Math.round(g + base.data[i + 1] * (1 - a));
      base.data[i + 2] = Math.round(b + base.data[i + 2] * (1 - a));
    }
  }
  return base;
}

/** Décode un logo PNG ou JPEG ; null pour les autres formats (GIF, WebP). */
export function decodeLogo(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return PNG.sync.read(Buffer.from(bytes));
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return jpeg.decode(bytes, { useTArray: true, formatAsRGBA: true });
  return null;
}

function main() {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const marksFile = `${root}public/og/marks.json`;
  const manifestFile = `${root}src/data/breach-logos.generated.json`;
  const out = `${root}public/og-logo`;
  rmSync(out, { recursive: true, force: true });
  if (!existsSync(marksFile) || !existsSync(manifestFile)) {
    console.log('[og-logos] Pas de logos ou de positions : images de partage sans logo.');
    return;
  }
  const marks = JSON.parse(readFileSync(marksFile, 'utf8'));
  const logos = JSON.parse(readFileSync(manifestFile, 'utf8'));
  mkdirSync(out, { recursive: true });
  let n = 0;
  for (const [slug, mark] of Object.entries(marks)) {
    const logoPath = logos[mark.name];
    const basePath = `${root}public/og/${slug}.jpg`;
    if (!logoPath || !existsSync(basePath)) continue;
    try {
      const logo = decodeLogo(readFileSync(`${root}public${logoPath}`));
      if (!logo) continue;
      const base = jpeg.decode(readFileSync(basePath), { useTArray: true, formatAsRGBA: true });
      compositeLogo(base, mark, logo);
      writeFileSync(`${out}/${slug}.jpg`, jpeg.encode(base, 86).data);
      n++;
    } catch (error) {
      console.warn(`[og-logos] ${slug} ignoré : ${error.message}.`);
    }
  }
  console.log(`[og-logos] ${n} images de partage avec logo.`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main();
  } catch (error) {
    console.warn(`[og-logos] Étape ignorée : ${error.message}. Le build continue.`);
  }
}
