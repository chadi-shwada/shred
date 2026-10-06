/**
 * Rappel d'échéance au format iCalendar (RFC 5545), généré dans le navigateur :
 * un événement sur la journée de l'échéance, avec une alerte la veille.
 */

import type { IsoDate } from './dates';

export interface Reminder {
  uid: string;
  date: IsoDate;
  summary: string;
  description: string;
}

/** Échappe le texte selon la RFC 5545 (3.3.11). */
function escapeText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Replie les lignes de plus de 75 octets UTF-8 (RFC 5545, 3.1), sans couper un caractère. */
function fold(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  let size = 0;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    const limit = parts.length === 0 ? 75 : 74; // les lignes de suite commencent par une espace
    if (size + bytes > limit) {
      parts.push(current);
      current = '';
      size = 0;
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

const compact = (date: IsoDate) => date.replace(/-/g, '');

/** Date du lendemain au format AAAAMMJJ (fin exclusive d'un événement sur une journée). */
function nextDay(date: IsoDate): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  return next.toISOString().slice(0, 10).replace(/-/g, '');
}

export function buildIcs(reminder: Reminder, now: Date = new Date()): string {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ShredRGPD//Suivi RGPD//FR',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${reminder.uid}@shred`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(reminder.date)}`,
    `DTEND;VALUE=DATE:${nextDay(reminder.date)}`,
    `SUMMARY:${escapeText(reminder.summary)}`,
    `DESCRIPTION:${escapeText(reminder.description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'TRIGGER:-P1D',
    `DESCRIPTION:${escapeText(reminder.summary)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
