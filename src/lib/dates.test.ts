import { describe, expect, it } from 'vitest';
import { addDays, addMonths, daysBetween, formatLongFr, gdprDeadlines, isValidIsoDate, todayIso } from './dates';

describe('isValidIsoDate', () => {
  it('accepte une date réelle', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true);
    expect(isValidIsoDate('2028-02-29')).toBe(true);
  });

  it('refuse une date impossible ou mal formée', () => {
    expect(isValidIsoDate('2026-02-29')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('5/10/2026')).toBe(false);
    expect(isValidIsoDate(20261005)).toBe(false);
  });
});

describe('addMonths', () => {
  it('garde le même quantième', () => {
    expect(addMonths('2026-10-05', 1)).toBe('2026-11-05');
  });

  it('passe à l’année suivante', () => {
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15');
    expect(addMonths('2026-11-30', 3)).toBe('2027-02-28');
  });

  it('se cale sur le dernier jour du mois quand le quantième n’existe pas', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28');
    expect(addMonths('2028-01-31', 1)).toBe('2028-02-29');
    expect(addMonths('2026-03-31', 1)).toBe('2026-04-30');
  });

  it('refuse une date invalide', () => {
    expect(() => addMonths('2026-02-30', 1)).toThrow();
  });
});

describe('addDays et daysBetween', () => {
  it('traverse les fins de mois et les changements d’heure', () => {
    expect(addDays('2026-10-25', 7)).toBe('2026-11-01');
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-11-05', '2026-10-05')).toBe(-31);
  });
});

describe('formatLongFr', () => {
  it('écrit « 1er » et les mois en français', () => {
    expect(formatLongFr('2026-10-01')).toBe('1er octobre 2026');
    expect(formatLongFr('2027-08-15')).toBe('15 août 2027');
  });
});

describe('gdprDeadlines (article 12.3)', () => {
  it('donne un mois, ou trois avec la prolongation', () => {
    expect(gdprDeadlines('2026-10-05')).toEqual({ standard: '2026-11-05', extended: '2027-01-05' });
  });
});

describe('todayIso', () => {
  it('utilise la date locale', () => {
    expect(todayIso(new Date(2026, 9, 5, 23, 59))).toBe('2026-10-05');
  });
});
