/** Types de scripts/og-logos.mjs, pour les tests (src/lib/ogLogos.test.ts). */

export interface RgbaImage {
  width: number;
  height: number;
  data: Uint8Array;
}

export function compositeLogo(
  base: RgbaImage,
  mark: { x: number; y: number; size: number; radius: number },
  logo: RgbaImage,
): RgbaImage;

export function decodeLogo(bytes: Uint8Array): RgbaImage | null;
