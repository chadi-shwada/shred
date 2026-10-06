/// <reference types="node" />
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { downloadLogos, imageType, logoFileName, logoTargets, MAX_LOGO_BYTES } from '../../scripts/breach-logos.mjs';

const PNG: Uint8Array<ArrayBuffer> = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0]);
const SVG: Uint8Array<ArrayBuffer> = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
);

const breach = (o: Record<string, unknown>) => ({
  Name: 'Free',
  Domain: 'free.fr',
  IsFrench: true,
  LogoPath: 'https://logos.example/Free.png',
  ...o,
});

describe('logos des fuites (build)', () => {
  it('ne vise que les fuites françaises avec une entreprise et un logo en https', () => {
    const names = logoTargets([
      breach({}),
      breach({ Name: 'Etranger', IsFrench: false }),
      breach({ Name: 'Compilation', Domain: '' }),
      breach({ Name: 'Stealer', IsMalware: true }),
      breach({ Name: 'Http', LogoPath: 'http://logos.example/x.png' }),
    ]).map((b) => b.Name);
    expect(names).toEqual(['Free']);
  });

  it('reconnaît les images par leur signature et refuse le SVG', () => {
    expect(imageType(PNG)).toBe('png');
    expect(imageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpg');
    expect(imageType(SVG)).toBeNull();
  });

  it('produit un nom de fichier sûr', () => {
    expect(logoFileName('../../Free Mobile', 'png')).toBe('FreeMobile.png');
  });

  let dir = '';
  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('enregistre les logos valides et ignore les autres', async () => {
    dir = await mkdtemp(join(tmpdir(), 'logos-'));
    const bodies: Record<string, Uint8Array<ArrayBuffer>> = {
      'https://logos.example/Free.png': PNG,
      'https://logos.example/Svg.svg': SVG,
      'https://logos.example/Big.png': new Uint8Array(MAX_LOGO_BYTES + 1).fill(0x89),
    };
    const fetchImpl = async (url: string) =>
      bodies[url] ? new Response(new Blob([bodies[url]])) : new Response('absent', { status: 404 });
    const warnings: string[] = [];
    const manifest = await downloadLogos(
      [
        breach({}),
        breach({ Name: 'Svg', LogoPath: 'https://logos.example/Svg.svg' }),
        breach({ Name: 'Big', LogoPath: 'https://logos.example/Big.png' }),
        breach({ Name: 'Absent', LogoPath: 'https://logos.example/Absent.png' }),
      ],
      dir,
      { fetchImpl, log: { warn: (m: string) => warnings.push(m) } },
    );
    expect(manifest).toEqual({ Free: '/logos/Free.png' });
    expect(await readdir(dir)).toEqual(['Free.png']);
    expect(warnings).toHaveLength(3);
  });
});
