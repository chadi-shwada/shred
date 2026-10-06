/** Types de scripts/og-logos.mjs, pour les tests (src/lib/ogLogos.test.ts). */

export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8Array;
}

export const LIGHT_BG: [number, number, number];
export const DARK_BG: [number, number, number];
export const LIGHT_LUMINANCE: number;

export function isLightLogo(img: RgbaImage): boolean;

export function compositeLogo(
  base: RgbaImage,
  mark: { x: number; y: number; size: number; radius: number },
  logo: RgbaImage,
  background?: [number, number, number],
): RgbaImage;

export function decodeLogo(bytes: Uint8Array): RgbaImage | null;
