import { describe, expect, it } from 'vitest';
import { toVtt } from './vtt';

describe('toVtt', () => {
  it('écrit un fichier WebVTT avec les heures au format hh:mm:ss.mmm', () => {
    expect(
      toVtt([
        { start: 0, end: 4.2, text: 'Bonjour' },
        { start: 65.5, end: 3725.004, step: 'Étape 1 : Cherche', text: 'Suite' },
      ]),
    ).toBe(
      'WEBVTT\n\n1\n00:00:00.000 --> 00:00:04.200\nBonjour\n\n2\n00:01:05.500 --> 01:02:05.004\nÉtape 1 : Cherche. Suite\n',
    );
  });
});
