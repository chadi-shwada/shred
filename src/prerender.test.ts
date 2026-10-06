import { describe, expect, it } from 'vitest';
import { renderPage } from './prerender';

describe('pré-rendu', () => {
  it('écrit le contenu des pages dans le HTML', async () => {
    expect(await renderPage('/a-propos')).toContain('<h1');
    expect(await renderPage('/verifier')).toContain('Qu&#x27;est-ce qui a fuité ?');
  });

  it('rend la page 404 pour une adresse inconnue', async () => {
    expect(await renderPage('/page-introuvable')).toContain('Cette page n&#x27;existe pas');
  });
});
