import { describe, expect, it } from 'vitest';
import { compositeLogo, DARK_BG, isLightLogo } from '../../scripts/og-logos.mjs';

/** Image unie RGBA. */
function solid(width: number, height: number, rgba: [number, number, number, number]) {
  const data = new Uint8Array(width * height * 4);
  for (let i = 0; i < data.length; i += 4) data.set(rgba, i);
  return { width, height, data };
}

const pixel = (img: { width: number; data: Uint8Array }, x: number, y: number) =>
  Array.from(img.data.slice((y * img.width + x) * 4, (y * img.width + x) * 4 + 3));

describe('logo dans l’image de partage (build)', () => {
  const mark = { x: 10, y: 10, size: 40, radius: 8 };

  it('pose un carré blanc arrondi et centre le logo dedans', () => {
    const base = compositeLogo(solid(60, 60, [0, 0, 0, 255]), mark, solid(20, 10, [205, 30, 37, 255]));
    expect(pixel(base, 30, 30)).toEqual([205, 30, 37]); // centre : le logo
    expect(pixel(base, 30, 14)).toEqual([255, 255, 255]); // marge : blanc
    expect(pixel(base, 2, 2)).toEqual([0, 0, 0]); // hors du médaillon : inchangé
    expect(pixel(base, 10, 10)).not.toEqual([255, 255, 255]); // coin arrondi : pas plein blanc
  });

  it('laisse voir le blanc là où le logo est transparent', () => {
    const base = compositeLogo(solid(60, 60, [0, 0, 0, 255]), mark, solid(20, 10, [205, 30, 37, 0]));
    expect(pixel(base, 30, 30)).toEqual([255, 255, 255]);
  });

  it('pose un carré sombre derrière un logo clair', () => {
    const base = compositeLogo(solid(60, 60, [0, 0, 0, 255]), mark, solid(20, 10, [255, 255, 255, 0]), DARK_BG);
    expect(pixel(base, 30, 30)).toEqual(DARK_BG);
  });
});

/** Logo de 10 × 10 : un carré de 4 × 4 de la couleur donnée, le reste transparent. */
function logo(rgb: [number, number, number]) {
  const img = solid(10, 10, [0, 0, 0, 0]);
  for (let y = 3; y < 7; y++) for (let x = 3; x < 7; x++) img.data.set([...rgb, 255], (y * 10 + x) * 4);
  return img;
}

describe('logo clair (build)', () => {
  it('repère un logo blanc ou très clair sur fond transparent', () => {
    expect(isLightLogo(logo([255, 255, 255]))).toBe(true);
    expect(isLightLogo(logo([230, 230, 230]))).toBe(true);
  });

  it('laisse sur fond blanc les logos foncés ou colorés', () => {
    expect(isLightLogo(logo([0, 0, 0]))).toBe(false);
    expect(isLightLogo(logo([205, 30, 37]))).toBe(false); // rouge Free
    expect(isLightLogo(logo([47, 75, 220]))).toBe(false);
  });

  it('ne touche pas aux logos opaques, qui portent leur fond', () => {
    expect(isLightLogo(solid(10, 10, [255, 255, 255, 255]))).toBe(false);
  });

  it('ignore une image entièrement transparente', () => {
    expect(isLightLogo(solid(10, 10, [255, 255, 255, 0]))).toBe(false);
  });
});
