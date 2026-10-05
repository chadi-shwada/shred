import { describe, expect, it } from 'vitest';
import vercel from '../vercel.json';
import { CSP_HEADER, CSP_META } from './security';

function headerValue(key: string): string | undefined {
  return vercel.headers.flatMap((rule) => rule.headers).find((h) => h.key === key)?.value;
}

describe('politique de sécurité', () => {
  it('n’autorise qu’une seule origine réseau : Pwned Passwords (règle n° 1)', () => {
    expect(CSP_META).toContain('connect-src https://api.pwnedpasswords.com;');
    expect(CSP_META.match(/https?:\/\/[^\s;]+/g)).toEqual(['https://api.pwnedpasswords.com']);
  });

  it('vercel.json envoie la même CSP que la balise, plus frame-ancestors', () => {
    expect(headerValue('Content-Security-Policy')).toBe(CSP_HEADER);
    expect(CSP_HEADER).toBe(`${CSP_META}; frame-ancestors 'none'`);
  });

  it("vercel.json s'applique à toutes les routes", () => {
    expect(vercel.headers.some((rule) => rule.source === '/(.*)')).toBe(true);
  });

  it('vercel.json ne transmet pas de référent', () => {
    expect(headerValue('Referrer-Policy')).toBe('no-referrer');
  });
});
