/** Types de scripts/breach-logos.mjs, pour les tests (src/lib/breachLogos.test.ts). */

export const MAX_LOGO_BYTES: number;

export function logoTargets<T extends Record<string, unknown>>(rawBreaches: T[]): T[];

export function imageType(bytes: Uint8Array): 'png' | 'jpg' | 'gif' | 'webp' | null;

export function logoFileName(name: string, type: string): string;

export function downloadLogos(
  rawBreaches: Record<string, unknown>[],
  outDir: string,
  options?: {
    fetchImpl?: (url: string, init?: RequestInit) => Promise<Response>;
    log?: Pick<Console, 'warn'>;
  },
): Promise<Record<string, { src: string; light: boolean }>>;
