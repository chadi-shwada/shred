import { describe, expect, it } from 'vitest';
import { buildIcs } from './ics';

const ics = buildIcs(
  {
    uid: 'abc',
    date: '2026-12-31',
    summary: 'Échéance RGPD : exemple.test — délai légal écoulé, réponse attendue, éléments à préparer',
    description: 'Demande d’effacement envoyée le 30 novembre 2026; relance possible, puis CNIL.\nNote',
  },
  new Date(Date.UTC(2026, 9, 5, 12, 0, 0)),
);
const lines = ics.split('\r\n');

describe('buildIcs', () => {
  it('produit un calendrier valide avec un événement sur la journée', () => {
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261231\r\n');
    expect(ics).toContain('DTEND;VALUE=DATE:20270101\r\n');
    expect(ics).toContain('DTSTAMP:20261005T120000Z\r\n');
    expect(ics).toContain('UID:abc@shred\r\n');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });

  it('prévient la veille', () => {
    expect(ics).toContain('TRIGGER:-P1D');
  });

  it('échappe les caractères spéciaux et replie les lignes longues', () => {
    // Les lignes sont repliées : on recolle avant de chercher.
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain('le 30 novembre 2026\\; relance possible\\, puis CNIL.\\nNote');
    const encoder = new TextEncoder();
    expect(lines.every((l) => encoder.encode(l).length <= 75)).toBe(true);
    expect(lines.some((l) => l.startsWith(' '))).toBe(true);
  });
});
