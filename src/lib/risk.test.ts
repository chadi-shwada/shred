import { describe, expect, it } from 'vitest';
import { breachRisk } from './risk';

describe('breachRisk', () => {
  it('classe selon la donnée la plus sensible', () => {
    expect(breachRisk(['Email addresses', 'Bank account numbers', 'Names'])).toBe('eleve');
    expect(breachRisk(['Email addresses', 'Passwords'])).toBe('eleve');
    expect(breachRisk(['Email addresses', 'Phone numbers'])).toBe('moyen');
    expect(breachRisk(['Email addresses', 'Names', 'Genders'])).toBe('faible');
    expect(breachRisk([])).toBe('faible');
  });
});
