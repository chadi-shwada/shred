import { describe, expect, it } from 'vitest';
import { href, isAppLink, parseLocation } from './router';

describe('href', () => {
  it('place les paramètres dans le fragment, jamais envoyé au serveur', () => {
    expect(href('/lettre')).toBe('/lettre');
    expect(href('/lettre', { site: 'exemple.test', type: 'relance' })).toBe('/lettre#site=exemple.test&type=relance');
    expect(href('/lettre', { site: 'a' })).not.toContain('?');
  });
});

describe('parseLocation', () => {
  it('lit le chemin et les paramètres du fragment', () => {
    const route = parseLocation('/lettre/', '#site=exemple.test&type=relance');
    expect(route.path).toBe('/lettre');
    expect(route.query.get('site')).toBe('exemple.test');
  });

  it('comprend les anciennes adresses en #/page?param', () => {
    const route = parseLocation('/', '#/suivi?x=1');
    expect(route.path).toBe('/suivi');
    expect(route.query.get('x')).toBe('1');
  });

  it("ramène l'accueil à « / »", () => {
    expect(parseLocation('', '').path).toBe('/');
    expect(parseLocation('//', '').path).toBe('/');
  });

  it('ignore une ancre simple comme #contenu', () => {
    expect(parseLocation('/ressources', '#contenu').path).toBe('/ressources');
  });
});

describe('isAppLink', () => {
  it('garde les pages internes et laisse passer les fichiers et liens externes', () => {
    expect(isAppLink('/lettre#site=x')).toBe(true);
    expect(isAppLink('/fuite/free')).toBe(true);
    expect(isAppLink('/fuites.xml')).toBe(false);
    expect(isAppLink('/videos/shred-demo.mp4')).toBe(false);
    expect(isAppLink('//exemple.test/page')).toBe(false);
    expect(isAppLink('https://exemple.test')).toBe(false);
  });
});
