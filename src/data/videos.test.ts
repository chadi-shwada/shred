import { describe, expect, it } from 'vitest';
import { toVtt } from '../lib/vtt';
import { PRESENTATION } from './videos';

// Fichiers présents dans public/videos/, et contenu des sous-titres.
const files = Object.keys(import.meta.glob('../../public/videos/*')).map((p) => p.replace('../../public', ''));
const vtt = import.meta.glob<string>('../../public/videos/*.vtt', { query: '?raw', import: 'default', eager: true });

describe.each([PRESENTATION])('vidéo $id', (video) => {
  it('a ses fichiers dans public/', () => {
    for (const path of [video.src, video.poster, video.captions]) expect(files).toContain(path);
  });

  it('garde ses sous-titres alignés sur la transcription', () => {
    expect(vtt[`../../public${video.captions}`]).toBe(toVtt(video.cues));
  });

  it('a des répliques dans l’ordre, sans chevauchement', () => {
    video.cues.forEach((cue, i) => {
      expect(cue.end).toBeGreaterThan(cue.start);
      if (i > 0) expect(cue.start).toBeGreaterThanOrEqual(video.cues[i - 1]!.end);
    });
  });
});

describe('vidéo de présentation', () => {
  it('présente le principe en 45 s, sans la démo pas à pas', () => {
    const texts = PRESENTATION.cues.map((c) => c.text);
    expect(texts[0]).toContain('Tes données ont fuité');
    expect(texts.some((t) => t.startsWith('Shred, de A à Z'))).toBe(false);
    expect(PRESENTATION.cues.at(-1)!.end).toBeLessThanOrEqual(45);
  });
});
